using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;

public enum MemberStatus
{
    Pending,
    Active,
    Inactive
}

public class Member
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [ForeignKey(nameof(GroupId))]
    public Group Group { get; set; } = null!;
    
    [Required]
    public Guid UserId { get; set; }
    
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    
    public MemberStatus Status { get; set; } = MemberStatus.Active;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}