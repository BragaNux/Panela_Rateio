using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.Models;

namespace Panela.Api.Services;
public class GroupService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notifications;
    public GroupService(AppDbContext db, NotificationService notifications){ _db = db; _notifications = notifications; }
    public async Task<Group> CriarAsync(Guid creatorId, string nome, string descricao)
    {
        var g = new Group { 
            Nome = nome, 
            Descricao = descricao,
            CreatorId = creatorId,
            Finalizado = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Groups.Add(g);
        _db.Members.Add(new Member { Group = g, UserId = creatorId, Status = MemberStatus.Active });
        await _db.SaveChangesAsync();
        return g;
    }
    public Task<List<Group>> ListarAsync(Guid userId)
    {
        return _db.Members.Where(m => m.UserId == userId).Select(m => m.Group!).ToListAsync();
    }
    public async Task<Group?> ObterAsync(Guid id)
    {
        return await _db.Groups.Include(g => g.Members).ThenInclude(m => m.User).Include(g => g.Expenses).ThenInclude(e => e.Payer).FirstOrDefaultAsync(g => g.Id == id);
    }
    public async Task EntrarAsync(Guid groupId, Guid userId)
    {
        var existe = await _db.Members.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);
        if (existe != null) return;
        _db.Members.Add(new Member { GroupId = groupId, UserId = userId, Status = MemberStatus.Active });
        await _db.SaveChangesAsync();
    }
    public async Task<Group?> AtualizarAsync(Guid groupId, string nome, string descricao)
    {
        var g = await _db.Groups.FindAsync(groupId);
        if (g == null) return null;
        g.Nome = nome;
        g.Descricao = descricao;
        await _db.SaveChangesAsync();
        return g;
    }
    public async Task<bool> RemoverAsync(Guid groupId)
    {
        var g = await _db.Groups.FindAsync(groupId);
        if (g == null) return false;
        _db.Groups.Remove(g);
        await _db.SaveChangesAsync();
        return true;
    }
    public async Task AdicionarMembroAsync(Guid groupId, Guid userId)
    {
        var g = await _db.Groups.FindAsync(groupId);
        if (g == null) return;
        if (g.Finalizado) throw new InvalidOperationException("Grupo finalizado");
        var usuarioExiste = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!usuarioExiste) return;
        var existe = await _db.Members.FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);
        if (existe != null) return;
        _db.Members.Add(new Member { GroupId = groupId, UserId = userId, Status = MemberStatus.Active });
        await _db.SaveChangesAsync();
    }

    public async Task<Group?> FinalizarAsync(Guid groupId)
    {
        var g = await _db.Groups.FindAsync(groupId);
        if (g == null) return null;
        if (g.Finalizado) return g;
        
        g.Finalizado = true;
        g.FinalizadoEm = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        var membros = await _db.Members.Where(m => m.GroupId == groupId).Select(m => m.UserId).ToListAsync();
        foreach (var uid in membros)
        {
            await _notifications.AddAsync(uid, "group_finalized", $"Grupo '{g.Nome}' foi finalizado");
        }
        return g;
    }
}
