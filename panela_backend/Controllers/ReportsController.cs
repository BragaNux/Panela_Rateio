using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.Services;
using System.Security.Claims;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly CalculationService _calculationService;
    private readonly PdfService _pdfService;
    
    public ReportsController(CalculationService calculationService, PdfService pdfService)
    {
        _calculationService = calculationService;
        _pdfService = pdfService;
    }

    private Guid UserId => Guid.Parse(User.Claims.First(c => c.Type == "userId").Value);

    [HttpGet("group/{groupId}/summary")]
    public async Task<ActionResult> ObterResumoFinanceiro([FromRoute] Guid groupId)
    {
        try
        {
            var resumo = await _calculationService.ObterResumoFinanceiroAsync(groupId);
            return Ok(resumo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("group/{groupId}/balances")]
    public async Task<ActionResult> ObterSaldos([FromRoute] Guid groupId)
    {
        try
        {
            var saldos = await _calculationService.CalcularSaldosAsync(groupId);
            return Ok(saldos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("group/{groupId}/simplified-transactions")]
    public async Task<ActionResult> ObterTransacoesSimplificadas([FromRoute] Guid groupId)
    {
        try
        {
            var saldos = await _calculationService.CalcularSaldosAsync(groupId);
            var transacoes = _calculationService.SimplificarTransacoes(saldos);
            return Ok(transacoes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("group/{groupId}/pdf")]
    public async Task<ActionResult> GerarPdf([FromRoute] Guid groupId)
    {
        try
        {
            var pdfBytes = await _pdfService.GerarRelatorioGrupoAsync(groupId);
            
            return File(pdfBytes, "application/pdf", $"relatorio-grupo-{groupId}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}