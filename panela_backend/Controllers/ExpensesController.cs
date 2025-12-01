using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.DTOs;
using Panela.Api.Services;

namespace Panela.Api.Controllers;
[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly ExpenseService _expenses;
    public ExpensesController(ExpenseService expenses){ _expenses = expenses; }
    private Guid UserId => Guid.Parse(User.Claims.First(c => c.Type == "userId").Value);
    [HttpPost]
    public async Task<ActionResult> Criar([FromBody] CriarDespesaDto dto)
    {
        if (dto.Valor <= 0) return BadRequest("Valor deve ser positivo");
        if (string.IsNullOrWhiteSpace(dto.PagadorNome)) return BadRequest("Nome do pagador obrigatório");
        // Bloquear criação de despesa em grupo finalizado
        var g = await _expenses.ObterGrupoAsync(dto.GroupId);
        if (g == null) return NotFound("Grupo não encontrado");
        if (g.Finalizado) return BadRequest("Não é possível adicionar despesas em grupo finalizado");
        var e = await _expenses.CriarAsync(dto.GroupId, UserId, dto.Descricao, dto.Valor, dto.Data ?? DateTime.UtcNow, dto.PagadorNome, dto.Splits);
        return Ok(new { e.Id, e.Descricao, e.Amount, e.Date, e.GroupId, e.PayerId, e.PagadorNome });
    }
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult> Listar([FromRoute] Guid groupId)
    {
        var lista = await _expenses.ListarPorGrupoAsync(groupId);
        return Ok(lista.Select(e => new { e.Id, e.Descricao, e.Amount, e.Date, e.PayerId, e.PagadorNome, ParticipantesCount = e.Splits.Count }));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Remover([FromRoute] Guid id)
    {
        var ok = await _expenses.RemoverAsync(id);
        if (!ok) return BadRequest("Não foi possível remover a despesa");
        return NoContent();
    }
}
