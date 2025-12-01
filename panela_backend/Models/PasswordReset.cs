using System.ComponentModel.DataAnnotations;

namespace Panela.Api.Models;
public class PasswordReset
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    public Guid UserId { get; set; }
    [Required]
    public string CodeHash { get; set; } = string.Empty;
    [Required]
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
