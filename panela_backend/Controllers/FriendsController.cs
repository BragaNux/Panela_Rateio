using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.DTOs;
using Panela.Api.Services;
using System.Security.Claims;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly FriendService _friendService;
    
    public FriendsController(FriendService friendService)
    {
        _friendService = friendService;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new Exception("User ID not found in claims");
        return userId;
    }

    [HttpPost("send-request")]
    public async Task<ActionResult<SolicitacaoAmizadeDto>> EnviarSolicitacao([FromBody] EnviarSolicitacaoAmizadeDto dto)
    {
        try
        {
            var userId = GetUserId();
            var result = await _friendService.EnviarSolicitacaoAsync(userId, dto.ReceiverEmail);
            
            if (result == null)
                return BadRequest(new { message = "Não foi possível enviar solicitação. Verifique se o usuário existe ou se já são amigos." });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("requests")]
    public async Task<ActionResult<SolicitacaoAmizadeDto>> EnviarSolicitacaoAlt([FromBody] EnviarSolicitacaoAmizadeDto dto)
    {
        try
        {
            var userId = GetUserId();
            var solicitacao = await _friendService.EnviarSolicitacaoAsync(userId, dto.ReceiverEmail);
            if (solicitacao == null) return BadRequest(new { message = "Não foi possível enviar solicitação" });
            return Ok(solicitacao);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("pending-requests")]
    public async Task<ActionResult<List<SolicitacaoAmizadeDto>>> ObterSolicitacoesPendentes()
    {
        try
        {
            var userId = GetUserId();
            var solicitacoes = await _friendService.ObterSolicitacoesPendentesAsync(userId);
            return Ok(solicitacoes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("sent-requests")]
    public async Task<ActionResult<List<SolicitacaoAmizadeDto>>> ObterSolicitacoesEnviadas()
    {
        try
        {
            var userId = GetUserId();
            var solicitacoes = await _friendService.ObterSolicitacoesEnviadasAsync(userId);
            return Ok(solicitacoes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("respond-request")]
    public async Task<ActionResult> ResponderSolicitacao([FromBody] ResponderSolicitacaoAmizadeDto dto)
    {
        try
        {
            var userId = GetUserId();
            var success = await _friendService.ResponderSolicitacaoAsync(dto.RequestId, userId, dto.Aceitar);
            
            if (!success)
                return BadRequest(new { message = "Não foi possível responder à solicitação." });
            
            return Ok(new { message = dto.Aceitar ? "Solicitação aceita com sucesso!" : "Solicitação recusada com sucesso!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<AmigoDto>>> ObterAmigos()
    {
        try
        {
            var userId = GetUserId();
            var amigos = await _friendService.ObterAmigosAsync(userId);
            return Ok(amigos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> ObterAmigo([FromRoute] Guid id)
    {
        try
        {
            var currentUserId = GetUserId();
            var (amigo, friendshipDate) = await _friendService.ObterAmigoAsync(currentUserId, id);
            if (amigo == null) return NotFound(new { message = "Amigo não encontrado" });
            return Ok(new { Id = amigo.Id, Nome = amigo.Nome, Email = amigo.Email, ChavePix = amigo.ChavePix, FriendshipDate = friendshipDate });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
    
    

    [HttpDelete("remove/{friendId}")]
    public async Task<ActionResult> RemoverAmigo(Guid friendId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _friendService.RemoverAmigoAsync(userId, friendId);
            
            if (!success)
                return NotFound(new { message = "Amigo não encontrado." });
            
            return Ok(new { message = "Amigo removido com sucesso!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    

    [HttpPut("requests/{id}/accept")]
    public async Task<ActionResult> AceitarSolicitacao([FromRoute] Guid id)
    {
        try
        {
            var ok = await _friendService.AceitarSolicitacaoAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("requests/{id}/reject")]
    public async Task<ActionResult> RecusarSolicitacao([FromRoute] Guid id)
    {
        try
        {
            var ok = await _friendService.RecusarSolicitacaoAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    
}
