using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.DTOs;
using Panela.Api.Services;

namespace Panela.Api.Controllers;
[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly GroupService _groups;
    public GroupsController(GroupService groups){ _groups = groups; }
    private Guid UserId => Guid.Parse(User.Claims.First(c => c.Type == "userId").Value);
    [HttpPost]
    public async Task<ActionResult<GrupoDto>> Criar([FromBody] CriarGrupoDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Nome)) return BadRequest("Nome obrigatório");
            var descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? string.Empty : dto.Descricao;
            var g = await _groups.CriarAsync(UserId, dto.Nome, descricao);
            if (dto.MembrosUserIds != null)
            {
                foreach (var uid in dto.MembrosUserIds)
                {
                    if (uid != UserId)
                        await _groups.AdicionarMembroAsync(g.Id, uid);
                }
            }
            return Ok(new GrupoDto(g.Id, g.Nome, g.Descricao ?? string.Empty, g.CreatorId, g.Finalizado, g.FinalizadoEm, g.CriadoEm));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
    [HttpGet]
    public async Task<ActionResult> Listar()
    {
        var lista = await _groups.ListarAsync(UserId);
        return Ok(lista.Select(g => new GrupoDto(g.Id, g.Nome, g.Descricao ?? string.Empty, g.CreatorId, g.Finalizado, g.FinalizadoEm, g.CriadoEm)));
    }
    [HttpGet("{id}")]
    public async Task<ActionResult> Obter([FromRoute] Guid id)
    {
        var g = await _groups.ObterAsync(id);
        if (g == null) return NotFound();
        return Ok(new GrupoDto(g.Id, g.Nome, g.Descricao ?? string.Empty, g.CreatorId, g.Finalizado, g.FinalizadoEm, g.CriadoEm));
    }
    [HttpPut("{id}")]
    public async Task<ActionResult<GrupoDto>> Atualizar([FromRoute] Guid id, [FromBody] AtualizarGrupoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nome)) return BadRequest("Nome obrigatório");
        var descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? string.Empty : dto.Descricao;
        var g = await _groups.AtualizarAsync(id, dto.Nome, descricao);
        if (g == null) return NotFound();
        return Ok(new GrupoDto(g.Id, g.Nome, g.Descricao ?? string.Empty, g.CreatorId, g.Finalizado, g.FinalizadoEm, g.CriadoEm));
    }
    [HttpDelete("{id}")]
    public async Task<ActionResult> Remover([FromRoute] Guid id)
    {
        var ok = await _groups.RemoverAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
    [HttpPost("{id}/join")]
    public async Task<ActionResult> Entrar([FromRoute] Guid id)
    {
        await _groups.EntrarAsync(id, UserId);
        return NoContent();
    }
    [HttpPost("{id}/members")]
    public async Task<ActionResult> AdicionarMembro([FromRoute] Guid id, [FromBody] AdicionarMembroDto dto)
    {
        var g = await _groups.ObterAsync(id);
        if (g == null) return NotFound();
        if (g.Finalizado) return BadRequest("Não é possível adicionar membros em grupo finalizado");
        await _groups.AdicionarMembroAsync(id, dto.UserId);
        return NoContent();
    }
    [HttpGet("{id}/members")]
    public async Task<ActionResult> Membros([FromRoute] Guid id)
    {
        var g = await _groups.ObterAsync(id);
        if (g == null) return NotFound();
        return Ok(g.Members.Select(m => new { m.UserId, Nome = m.User!.Nome, Email = m.User!.Email, ChavePix = m.User!.ChavePix, m.Status, m.JoinedAt }));
    }

    [HttpPut("{id}/finalize")]
    public async Task<ActionResult<GrupoDto>> Finalizar([FromRoute] Guid id)
    {
        var g = await _groups.FinalizarAsync(id);
        if (g == null) return NotFound();
        return Ok(new GrupoDto(g.Id, g.Nome, g.Descricao ?? string.Empty, g.CreatorId, g.Finalizado, g.FinalizadoEm, g.CriadoEm));
    }

    [HttpGet("{id}/pdf")]
    public async Task<ActionResult> GerarPdf([FromRoute] Guid id)
    {
        var pdf = HttpContext.RequestServices.GetRequiredService<PdfService>();
        var bytes = await pdf.GerarRelatorioGrupoAsync(id);
        return File(bytes, "application/pdf", $"relatorio-grupo-{id}.pdf");
    }
}
