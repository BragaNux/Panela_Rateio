using System.Net;
using System.Net.Mail;

namespace Panela.Api.Services;
public class EmailService
{
    private readonly ILogger<EmailService> _logger;
    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = Environment.GetEnvironmentVariable("SMTP_HOST");
        var portStr = Environment.GetEnvironmentVariable("SMTP_PORT");
        var secureStr = Environment.GetEnvironmentVariable("SMTP_SECURE");
        var user = Environment.GetEnvironmentVariable("SMTP_USER");
        var pass = Environment.GetEnvironmentVariable("SMTP_PASS");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(portStr))
            throw new InvalidOperationException("SMTP não configurado");
        var port = int.TryParse(portStr, out var p) ? p : 25;
        var enableSsl = string.Equals(secureStr, "true", StringComparison.OrdinalIgnoreCase);

        var from = string.IsNullOrWhiteSpace(user) ? "no-reply@panela.local" : user;
        using var msg = new MailMessage(new MailAddress(from, "Panela"), new MailAddress(toEmail))
        {
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };

        async Task TrySendAsync(string h, int prt, bool ssl)
        {
            using var client = new SmtpClient(h, prt)
            {
                EnableSsl = ssl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass)) ? new NetworkCredential(user!, pass!) : null,
                Timeout = 10000
            };
            await client.SendMailAsync(msg);
        }

        try
        {
            await TrySendAsync(host!, port, enableSsl);
            _logger.LogInformation("Email enviado para {email}", toEmail);
        }
        catch (Exception ex)
        {
            var triedImplicitSsl465 = enableSsl && port == 465;
            if (triedImplicitSsl465)
            {
                try
                {
                    await TrySendAsync(host!, 587, true);
                    _logger.LogInformation("Email enviado via fallback STARTTLS:587 para {email}", toEmail);
                    return;
                }
                catch (Exception ex2)
                {
                    _logger.LogError(ex2, "Falha SMTP (fallback 587) para {email}");
                }
            }
            _logger.LogError(ex, "Falha SMTP para {email}");
            throw new InvalidOperationException("Falha ao enviar email. Verifique configuração SMTP.");
        }
    }
}
