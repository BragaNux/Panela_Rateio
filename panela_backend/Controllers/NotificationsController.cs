using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.Services;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notifications;
    public NotificationsController(NotificationService notifications){ _notifications = notifications; }

    private Guid UserId => Guid.Parse(User.Claims.First(c => c.Type == "userId").Value);

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] int limit = 50)
    {
        var list = await _notifications.ListAsync(UserId, Math.Clamp(limit, 1, 200));
        return Ok(list.Select(n => new { n.Id, n.Type, n.Message, n.IsRead, n.CreatedAt }));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult> UnreadCount()
    {
        var count = await _notifications.GetUnreadCountAsync(UserId);
        return Ok(new { count });
    }

    public record MarkReadDto(Guid[]? Ids);

    [HttpPost("mark-read")]
    public async Task<ActionResult> MarkRead([FromBody] MarkReadDto dto)
    {
        await _notifications.MarkReadAsync(UserId, dto.Ids);
        return Ok(new { ok = true });
    }
}
