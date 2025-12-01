using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Panela.Api.Models;

public enum SplitMode
{
    Equal,
    Percentage,
    FixedAmount
}

public class Split
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid ExpenseId { get; set; }
    
    [ForeignKey(nameof(ExpenseId))]
    public Expense Expense { get; set; } = null!;
    
    [Required]
    public Guid MemberId { get; set; }
    
    [ForeignKey(nameof(MemberId))]
    public Member Member { get; set; } = null!;
    
    public SplitMode Mode { get; set; } = SplitMode.Equal;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShareValue { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}