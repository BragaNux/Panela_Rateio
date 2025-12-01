using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Panela.Api.Services;

namespace Panela.Api.Services;

public class AiService
{
    private readonly CalculationService _calc;
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public AiService(CalculationService calc, HttpClient http)
    {
        _calc = calc;
        _http = http;
        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? string.Empty;
    }

    public async Task<string> SummarizeGroupAsync(Guid groupId, string? model = null)
    {
        var resumo = await _calc.ObterResumoFinanceiroAsync(groupId);
        var positivos = resumo.Saldos.Values.Where(s => s.Saldo > 0).OrderByDescending(s => s.Saldo).Take(3).ToList();
        var negativos = resumo.Saldos.Values.Where(s => s.Saldo < 0).OrderBy(s => s.Saldo).Take(3).ToList();

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            var topReceber = string.Join(", ", positivos.Select(p => $"{p.UserNome} +{p.Saldo:0.00}"));
            var topPagar = string.Join(", ", negativos.Select(n => $"{n.UserNome} {n.Saldo:0.00}"));
            if (positivos.Count == 0 && negativos.Count == 0)
                return "Sem movimentações: ninguém deve pagar ou receber.";
            if (positivos.Count == 0)
                return $"Resumo: {topPagar}.";
            if (negativos.Count == 0)
                return $"Resumo: {topReceber}.";
            return $"Resumo: Receber → {topReceber}. Pagar → {topPagar}.";
        }

        var sb = new StringBuilder();
        sb.AppendLine("Gere um resumo curto e amigável (1-2 frases) do rateio.");
        sb.AppendLine("Foque em quem deve pagar e quem deve receber, sem detalhar tudo.");
        foreach (var p in positivos)
            sb.AppendLine($"Receber: {p.UserNome} +{p.Saldo:0.00}");
        foreach (var n in negativos)
            sb.AppendLine($"Pagar: {n.UserNome} {n.Saldo:0.00}");

        var mdl = string.IsNullOrWhiteSpace(model) ? "gemini-3-pro-preview" : model.Trim();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{mdl}:generateContent?key={_apiKey}";
        var payload = new
        {
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = sb.ToString() } } }
            },
            generationConfig = new { temperature = 0.2, maxOutputTokens = 60 }
        };

        var json = JsonSerializer.Serialize(payload);
        var req = new StringContent(json, Encoding.UTF8, "application/json");
        var resp = await _http.PostAsync(url, req);
        var body = await resp.Content.ReadAsStringAsync();

        try
        {
            using var doc = JsonDocument.Parse(body);
            var txt = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();
            return txt ?? "";
        }
        catch
        {
            return "Não foi possível gerar o resumo por IA.";
        }
    }
}
