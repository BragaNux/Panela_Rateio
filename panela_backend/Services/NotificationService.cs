using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.Models;

namespace Panela.Api.Services;

public class NotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db){ _db = db; }

    public async Task<Notification> AddAsync(Guid userId, string type, string message)
    {
        var n = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(n);
        await _db.SaveChangesAsync();
        return n;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).CountAsync();
    }

    public async Task<List<Notification>> ListAsync(Guid userId, int limit = 50)
    {
        return await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task MarkReadAsync(Guid userId, IEnumerable<Guid>? ids = null)
    {
        if (ids != null)
        {
            var toUpdate = await _db.Notifications.Where(n => n.UserId == userId && ids.Contains(n.Id)).ToListAsync();
            foreach (var n in toUpdate) n.IsRead = true;
        }
        else
        {
            await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
        }
        await _db.SaveChangesAsync();
    }
}
