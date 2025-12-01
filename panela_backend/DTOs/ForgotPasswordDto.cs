using System.ComponentModel.DataAnnotations;

namespace Panela.Api.DTOs;
public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
