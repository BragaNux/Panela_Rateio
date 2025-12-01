using System.ComponentModel.DataAnnotations;

namespace Panela.Api.DTOs;

public class UpdateProfileDto
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [StringLength(200, ErrorMessage = "Nome deve ter no máximo 200 caracteres")]
    public string Nome { get; set; } = "";
    
    [StringLength(100, ErrorMessage = "Chave PIX deve ter no máximo 100 caracteres")]
    public string? ChavePix { get; set; }
}