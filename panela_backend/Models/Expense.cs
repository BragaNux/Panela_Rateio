using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;
public class Expense
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [ForeignKey(nameof(GroupId))]
    public Group Group { get; set; } = null!;
    
    [Required]
    public Guid PayerId { get; set; }
    
    [ForeignKey(nameof(PayerId))]
    public User Payer { get; set; } = null!;
    
    // Campo desnormalizado conforme protótipo (para performance)
    [Required]
    [MaxLength(200)]
    public string PagadorNome { get; set; } = "";
    
    [Required]
    [MaxLength(300)]
    public string Descricao { get; set; } = "";
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    
    public DateTime Date { get; set; } = DateTime.UtcNow;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public ICollection<Split> Splits { get; set; } = new List<Split>();
}