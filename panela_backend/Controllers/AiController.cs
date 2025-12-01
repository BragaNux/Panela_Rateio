using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Panela.Api.Services;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AiService _ai;
    public AiController(AiService ai){ _ai = ai; }

    [HttpGet("group/{groupId}/summary")]
    public async Task<ActionResult> Summarize([FromRoute] Guid groupId, [FromQuery] string? model = null)
    {
        var s = await _ai.SummarizeGroupAsync(groupId, model);
        return Ok(new { summary = s });
    }
}
