using System.ComponentModel.DataAnnotations;

namespace Panela.Api.Models;
public class User
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Nome { get; set; } = "";
    
    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = "";
    
    [Required]
    public string PasswordHash { get; set; } = "";
    
    [MaxLength(200)]
    public string? ChavePix { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public ICollection<Group> GroupsCreated { get; set; } = new List<Group>();
    public ICollection<Member> Memberships { get; set; } = new List<Member>();
    public ICollection<Expense> ExpensesPaid { get; set; } = new List<Expense>();
}