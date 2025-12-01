using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;

public class Friendship
{
    [Required]
    public Guid UserId1 { get; set; }
    
    [ForeignKey(nameof(UserId1))]
    public User User1 { get; set; } = null!;
    
    [Required]
    public Guid UserId2 { get; set; }
    
    [ForeignKey(nameof(UserId2))]
    public User User2 { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}