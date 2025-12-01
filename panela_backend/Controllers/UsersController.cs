using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.DTOs;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db){ _db = db; }

    [HttpGet("search")]
    public async Task<ActionResult<UserDto>> SearchByEmail([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { message = "Email é obrigatório" });
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        if (user == null) return NotFound(new { message = "Usuário não encontrado" });
        return Ok(new UserDto(user.Id, user.Nome, user.Email, user.ChavePix));
    }
}

