using System.ComponentModel.DataAnnotations;

namespace Panela.Api.DTOs;

public class UpdatePasswordDto
{
    [Required(ErrorMessage = "Senha atual é obrigatória")]
    [MinLength(6, ErrorMessage = "Senha atual deve ter no mínimo 6 caracteres")]
    public string SenhaAtual { get; set; } = "";
    
    [Required(ErrorMessage = "Nova senha é obrigatória")]
    [MinLength(6, ErrorMessage = "Nova senha deve ter no mínimo 6 caracteres")]
    public string NovaSenha { get; set; } = "";
}