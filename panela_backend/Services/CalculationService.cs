using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.DTOs;
using Panela.Api.Models;

namespace Panela.Api.Services;

public class CalculationService
{
    private readonly AppDbContext _db;
    
    public CalculationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Dictionary<Guid, decimal>> CalcularSaldosAsync(Guid groupId)
    {
        var expenses = await _db.Expenses
            .Where(e => e.GroupId == groupId)
            .Include(e => e.Splits)
            .ThenInclude(s => s.Member)
            .ToListAsync();

        var members = await _db.Members
            .Where(m => m.GroupId == groupId)
            .ToListAsync();

        var saldos = new Dictionary<Guid, decimal>();

        // Inicializar todos os usuários do grupo com saldo 0 (por UserId)
        foreach (var member in members)
        {
            saldos[member.UserId] = 0;
        }

        // Calcular saldos para cada despesa (chave por UserId)
        foreach (var expense in expenses)
        {
            // O pagador (UserId) recebe de volta o que pagou
            if (!saldos.ContainsKey(expense.PayerId)) saldos[expense.PayerId] = 0;
            saldos[expense.PayerId] += expense.Amount;

            // Cada participante (Member.UserId) deve pagar sua parte
            foreach (var split in expense.Splits)
            {
                var uid = split.Member.UserId;
                if (!saldos.ContainsKey(uid)) saldos[uid] = 0;
                saldos[uid] -= split.ShareValue;
            }
        }

        return saldos;
    }

    public List<TransacaoSimplificada> SimplificarTransacoes(Dictionary<Guid, decimal> saldos)
    {
        var transacoes = new List<TransacaoSimplificada>();
        
        // Separar devedores e credores
        var devedores = saldos.Where(kv => kv.Value < 0).OrderBy(kv => kv.Value).ToList();
        var credores = saldos.Where(kv => kv.Value > 0).OrderByDescending(kv => kv.Value).ToList();

        // Algoritmo guloso para simplificar transações
        while (devedores.Count > 0 && credores.Count > 0)
        {
            var maiorDevedor = devedores.First();
            var maiorCredor = credores.First();

            var valorTransacao = Math.Min(Math.Abs(maiorDevedor.Value), maiorCredor.Value);

            transacoes.Add(new TransacaoSimplificada
            {
                DevedorId = maiorDevedor.Key,
                CredorId = maiorCredor.Key,
                Valor = valorTransacao
            });

            // Atualizar saldos
            var novoSaldoDevedor = maiorDevedor.Value + valorTransacao;
            var novoSaldoCredor = maiorCredor.Value - valorTransacao;

            // Remover ou atualizar devedor
            devedores.RemoveAt(0);
            if (novoSaldoDevedor < 0)
            {
                devedores.Insert(0, new KeyValuePair<Guid, decimal>(maiorDevedor.Key, novoSaldoDevedor));
                devedores.Sort((a, b) => a.Value.CompareTo(b.Value));
            }

            // Remover ou atualizar credor
            credores.RemoveAt(0);
            if (novoSaldoCredor > 0)
            {
                credores.Insert(0, new KeyValuePair<Guid, decimal>(maiorCredor.Key, novoSaldoCredor));
                credores.Sort((a, b) => b.Value.CompareTo(a.Value));
            }
        }

        return transacoes;
    }

    public async Task<ResumoFinanceiroDto> ObterResumoFinanceiroAsync(Guid groupId)
    {
        var saldos = await CalcularSaldosAsync(groupId);
        var transacoes = SimplificarTransacoes(saldos);

        var membrosInfo = await _db.Members
            .Where(m => m.GroupId == groupId)
            .Include(m => m.User)
            .ToDictionaryAsync(m => m.UserId, m => m.User.Nome);

        var transacoesComNomes = transacoes.Select(t => new TransacaoSimplificadaDto(
            t.DevedorId,
            membrosInfo.GetValueOrDefault(t.DevedorId, "Desconhecido"),
            t.CredorId,
            membrosInfo.GetValueOrDefault(t.CredorId, "Desconhecido"),
            t.Valor
        )).ToList();

        var saldosComNomes = saldos.ToDictionary(
            kvp => kvp.Key,
            kvp => new SaldoInfoDto(
                kvp.Key,
                membrosInfo.GetValueOrDefault(kvp.Key, "Desconhecido"),
                kvp.Value
            )
        );

        return new ResumoFinanceiroDto(saldosComNomes, transacoesComNomes);
    }
}

public class TransacaoSimplificada
{
    public Guid DevedorId { get; set; }
    public Guid CredorId { get; set; }
    public decimal Valor { get; set; }
}

public record TransacaoSimplificadaDto(
    Guid DevedorId,
    string DevedorNome,
    Guid CredorId,
    string CredorNome,
    decimal Valor
);

public record SaldoInfoDto(
    Guid UserId,
    string UserNome,
    decimal Saldo
);

public record ResumoFinanceiroDto(
    Dictionary<Guid, SaldoInfoDto> Saldos,
    List<TransacaoSimplificadaDto> TransacoesSimplificadas
);
