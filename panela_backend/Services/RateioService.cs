using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;

namespace Panela.Api.Services;
public class RateioService
{
    private readonly AppDbContext _db;
    public RateioService(AppDbContext db){ _db = db; }
    public async Task<Dictionary<Guid, decimal>> CalcularSaldoPorUsuarioAsync(Guid groupId)
    {
        var membros = await _db.Members.Where(m => m.GroupId == groupId).Select(m => m.UserId).ToListAsync();
        var saldos = membros.ToDictionary(id => id, id => 0m);
        var despesas = await _db.Expenses.Where(e => e.GroupId == groupId).ToListAsync();
        foreach (var d in despesas)
        {
            saldos[d.PayerId] += d.Amount;
        }
        var splits = await _db.Splits.Where(s => s.Member.GroupId == groupId).ToListAsync();
        foreach (var s in splits)
        {
            saldos[s.Member.UserId] -= s.ShareValue;
        }
        return saldos;
    }
}