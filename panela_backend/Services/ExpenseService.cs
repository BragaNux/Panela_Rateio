using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.Models;

namespace Panela.Api.Services;
public class ExpenseService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notifications;
    public ExpenseService(AppDbContext db, NotificationService notifications){ _db = db; _notifications = notifications; }
    public Task<Group?> ObterGrupoAsync(Guid groupId)
    {
        return _db.Groups.FindAsync(groupId).AsTask();
    }
    public async Task<Expense> CriarAsync(Guid groupId, Guid payerId, string descricao, decimal valor, DateTime data, string pagadorNome, List<DTOs.SplitDto>? splits)
    {
        var e = new Expense { 
            GroupId = groupId, 
            PayerId = payerId, 
            Descricao = descricao, 
            Amount = valor, 
            Date = data,
            PagadorNome = pagadorNome
        };
        _db.Expenses.Add(e);
        await _db.SaveChangesAsync();
        var membros = await _db.Members.Where(m => m.GroupId == groupId).ToListAsync();
        if (splits == null || splits.Count == 0)
        {
            var cota = valor / Math.Max(membros.Count, 1);
            foreach (var m in membros)
            {
                _db.Splits.Add(new Split { ExpenseId = e.Id, MemberId = m.Id, Mode = SplitMode.Equal, ShareValue = cota });
            }
        }
        else
        {
            var porUser = membros.ToDictionary(m => m.UserId, m => m);
            foreach (var s in splits)
            {
                if (!porUser.TryGetValue(s.UserId, out var membro)) continue;
                var mode = s.Mode?.ToLowerInvariant() switch
                {
                    "percentage" => SplitMode.Percentage,
                    "fixedamount" => SplitMode.FixedAmount,
                    _ => SplitMode.Equal
                };
                _db.Splits.Add(new Split { ExpenseId = e.Id, MemberId = membro.Id, Mode = mode, ShareValue = s.ShareValue });
            }
        }
        await _db.SaveChangesAsync();
        var pagador = await _db.Users.FindAsync(payerId);
        var grupo = await _db.Groups.FindAsync(groupId);
        foreach (var m in membros.Where(m => m.UserId != payerId))
        {
            await _notifications.AddAsync(m.UserId, "new_expense", $"Nova despesa em '{grupo?.Nome}': {descricao} por {pagador?.Nome}");
        }
        return e;
    }
    public Task<List<Expense>> ListarPorGrupoAsync(Guid groupId)
    {
        return _db.Expenses.Where(e => e.GroupId == groupId).Include(e => e.Payer).Include(e => e.Splits).ToListAsync();
    }

    public async Task<bool> RemoverAsync(Guid expenseId)
    {
        var e = await _db.Expenses.Include(x => x.Group).FirstOrDefaultAsync(x => x.Id == expenseId);
        if (e == null) return false;
        if (e.Group != null && e.Group.Finalizado) return false;
        _db.Expenses.Remove(e);
        await _db.SaveChangesAsync();
        return true;
    }
}
