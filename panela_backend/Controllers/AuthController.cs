using Microsoft.AspNetCore.Mvc;
using Panela.Api.DTOs;
using Panela.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _db;
    private readonly EmailService _emailService;
    
    public AuthController(IAuthService authService, AppDbContext db, EmailService emailService)
    {
        _authService = authService;
        _db = db;
        _emailService = emailService;
    }
    
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var response = await _authService.RegisterAsync(dto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var response = await _authService.LoginAsync(dto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
    
    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Usuário não autenticado" });
                
            var response = await _authService.UpdateProfileAsync(Guid.Parse(userId), dto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
    
    [HttpPut("password")]
    [Authorize]
    public async Task<ActionResult> UpdatePassword([FromBody] UpdatePasswordDto dto)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Usuário não autenticado" });
                
            await _authService.UpdatePasswordAsync(Guid.Parse(userId), dto);
            return Ok(new { message = "Senha atualizada com sucesso" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
    [HttpPost("profile/photo")]
    [Authorize]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult> UploadPhoto([FromForm] IFormFile file)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Usuário não autenticado" });
            if (file == null || file.Length == 0) return BadRequest(new { message = "Arquivo inválido" });
            var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            Directory.CreateDirectory(uploads);
            var path = Path.Combine(uploads, $"{userId}.jpg");
            using (var stream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var url = $"/avatars/{userId}.jpg";
            return Ok(new { url });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Ok(new { message = "Se existe uma conta com este email, enviaremos um código" });

            var rnd = new Random();
            var code = rnd.Next(100000, 999999).ToString();
            var codeHash = BCrypt.Net.BCrypt.HashPassword(code);
            var reset = new Models.PasswordReset
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CodeHash = codeHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                Used = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.PasswordResets.Add(reset);
            await _db.SaveChangesAsync();

            var subject = "Código para redefinição de senha";
            var body = $"Seu código de verificação é: {code}\nEle expira em 15 minutos.";
            await _emailService.SendAsync(user.Email, subject, body);
            return Ok(new { message = "Código enviado" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return BadRequest(new { message = "Email inválido" });
            var reset = await _db.PasswordResets
                .Where(r => r.UserId == user.Id && !r.Used && r.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();
            if (reset == null)
                return BadRequest(new { message = "Código inválido ou expirado" });
            var ok = BCrypt.Net.BCrypt.Verify(dto.Code, reset.CodeHash);
            if (!ok)
                return BadRequest(new { message = "Código inválido" });
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
            reset.Used = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Senha redefinida com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("smtp-test")]
    public async Task<ActionResult> SmtpTest([FromQuery] string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email é obrigatório" });
            await _emailService.SendAsync(email, "Teste SMTP Panela", "Teste de envio SMTP.");
            return Ok(new { message = "Email de teste enviado" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
