using System.ComponentModel.DataAnnotations;

namespace Panela.Api.DTOs;

public record RegisterDto(
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    string Nome,
    
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    [MaxLength(200)]
    string Email,
    
    [Required(ErrorMessage = "Password é obrigatória")]
    [MinLength(6, ErrorMessage = "Password deve ter no mínimo 6 caracteres")]
    string Password,
    
    [MaxLength(200)]
    string? ChavePix
);

public record LoginDto(
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress]
    string Email,
    
    [Required(ErrorMessage = "Password é obrigatória")]
    string Password
);

public record UserDto(
    Guid Id,
    string Nome,
    string Email,
    string? ChavePix
);

public record AuthResponseDto(
    string Token,
    UserDto User
);