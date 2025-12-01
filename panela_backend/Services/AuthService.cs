using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Panela.Api.Data;
using Panela.Api.DTOs;
using Panela.Api.Models;

namespace Panela.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task UpdatePasswordAsync(Guid userId, UpdatePasswordDto dto);
    string GenerateJwtToken(Guid userId, string email);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    
    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _ = configuration;
    }
    
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Verificar se email já existe
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            throw new InvalidOperationException("Email já cadastrado");
        }
        
        // Criar usuário
        var user = new User
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            ChavePix = dto.ChavePix,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        // Gerar token
        var token = GenerateJwtToken(user.Id, user.Email);
        
        return new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Nome,
                user.Email,
                user.ChavePix
            )
        );
    }
    
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new InvalidOperationException("Email ou senha inválidos");
        }
        
        var token = GenerateJwtToken(user.Id, user.Email);
        
        return new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Nome,
                user.Email,
                user.ChavePix
            )
        );
    }
    
    public string GenerateJwtToken(Guid userId, string email)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "dev_secret_change_me";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("userId", userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public async Task<AuthResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Usuário não encontrado");
        }
        
        user.Nome = dto.Nome;
        user.ChavePix = dto.ChavePix;
        
        await _context.SaveChangesAsync();
        
        var token = GenerateJwtToken(user.Id, user.Email);
        
        return new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Nome,
                user.Email,
                user.ChavePix
            )
        );
    }
    
    public async Task UpdatePasswordAsync(Guid userId, UpdatePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Usuário não encontrado");
        }
        
        if (!BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, user.PasswordHash))
        {
            throw new InvalidOperationException("Senha atual incorreta");
        }
        
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
        await _context.SaveChangesAsync();
    }
}
