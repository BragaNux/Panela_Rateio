using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.Services;

namespace Panela.Api.Controllers;
[ApiController]
[Route("api/rateio")]
[Authorize]
public class RateioController : ControllerBase
{
    private readonly RateioService _rateio;
    public RateioController(RateioService rateio){ _rateio = rateio; }
    [HttpGet("group/{grupoId}")]
    public async Task<ActionResult> Calcular([FromRoute] Guid grupoId)
    {
        var saldos = await _rateio.CalcularSaldoPorUsuarioAsync(grupoId);
        return Ok(saldos.Select(kv => new { UsuarioId = kv.Key, Saldo = kv.Value }));
    }
}