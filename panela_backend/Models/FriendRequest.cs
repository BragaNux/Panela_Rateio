using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;

public class FriendRequest
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid RemetenteId { get; set; }
    
    [ForeignKey(nameof(RemetenteId))]
    public User Remetente { get; set; } = null!;
    
    [Required]
    public Guid DestinatarioId { get; set; }
    
    [ForeignKey(nameof(DestinatarioId))]
    public User Destinatario { get; set; } = null!;
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pendente"; // pendente, aceito, recusado
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}