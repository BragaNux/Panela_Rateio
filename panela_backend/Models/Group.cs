using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;
public class Group
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Nome { get; set; } = "";
    
    [MaxLength(500)]
    public string? Descricao { get; set; }
    
    [Required]
    public Guid CreatorId { get; set; }
    
    [ForeignKey(nameof(CreatorId))]
    public User Creator { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Alias para compatibilidade com o código existente
    public DateTime CriadoEm => CreatedAt;
    
    // Campos de finalização (adicionados conforme protótipo)
    public bool Finalizado { get; set; } = false;
    
    public DateTime? FinalizadoEm { get; set; }
    
    // Relacionamentos
    public ICollection<Member> Members { get; set; } = new List<Member>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}