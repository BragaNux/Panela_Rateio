using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.DTOs;
using Panela.Api.Models;

namespace Panela.Api.Services;

public class PdfService
{
    private readonly AppDbContext _db;
    private readonly CalculationService _calculationService;
    
    public PdfService(AppDbContext db, CalculationService calculationService)
    {
        _db = db;
        _calculationService = calculationService;
        
        // Configure QuestPDF license (community edition)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GerarRelatorioGrupoAsync(Guid groupId)
    {
        var grupo = await _db.Groups
            .Include(g => g.Creator)
            .Include(g => g.Members)
            .ThenInclude(m => m.User)
            .Include(g => g.Expenses)
            .ThenInclude(e => e.Payer)
            .Include(g => g.Expenses)
            .ThenInclude(e => e.Splits)
            .ThenInclude(s => s.Member)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (grupo == null)
            throw new Exception("Grupo não encontrado");

        var resumoFinanceiro = await _calculationService.ObterResumoFinanceiroAsync(groupId);
        
        var document = CreateGroupReportDocument(grupo, resumoFinanceiro);
        return document.GeneratePdf();
    }

    private IDocument CreateGroupReportDocument(Group grupo, ResumoFinanceiroDto resumoFinanceiro)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(12));

                page.Header()
                    .Height(100)
                    .Background("#059669")
                    .AlignCenter()
                    .AlignMiddle()
                    .Text(text =>
                    {
                        text.Span("🍳 PANELA").FontSize(28).FontColor(Colors.White).Bold();
                    });

                page.Content()
                    .PaddingVertical(20)
                    .Column(column =>
                    {
                        column.Spacing(20);

                        // Group Information
                        column.Item().SectionTitle("📋 Informações do Grupo");
                        column.Item().GroupInfo(grupo);

                        // Members
                        column.Item().SectionTitle("👥 Membros do Grupo");
                        column.Item().MembersList(grupo, resumoFinanceiro);

                        // Expenses
                        if (grupo.Expenses?.Any() == true)
                        {
                            column.Item().SectionTitle("💰 Despesas do Grupo");
                            column.Item().ExpensesTable(grupo.Expenses);
                        }

                        // Simplified Transactions
                        if (resumoFinanceiro.TransacoesSimplificadas?.Any() == true)
                        {
                            column.Item().SectionTitle("🔄 Transações Simplificadas");
                            column.Item().TransactionsList(resumoFinanceiro.TransacoesSimplificadas);
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Relatório gerado em ").FontSize(10).FontColor(Colors.Grey.Darken2);
                        x.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(10).FontColor(Colors.Grey.Darken2);
                    });
            });
        });
    }
}

public static class GroupReportExtensions
{
    public static void SectionTitle(this IContainer container, string title)
    {
        container.Text(title)
            .FontSize(18)
            .Bold()
            .FontColor("#059669");
    }

    public static void GroupInfo(this IContainer container, Group grupo)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn();
                columns.RelativeColumn();
            });

            table.Cell().Element(CellStyle).Text("Nome do Grupo:").SemiBold();
            table.Cell().Element(CellStyle).Text(grupo.Nome);

            table.Cell().Element(CellStyle).Text("Status:").SemiBold();
            table.Cell().Element(CellStyle).Text(grupo.Finalizado ? "Finalizado" : "Ativo");

            table.Cell().Element(CellStyle).Text("Criado por:").SemiBold();
            table.Cell().Element(CellStyle).Text(grupo.Creator?.Nome ?? "Desconhecido");

            table.Cell().Element(CellStyle).Text("Data de Criação:").SemiBold();
            table.Cell().Element(CellStyle).Text(grupo.CriadoEm.ToString("dd/MM/yyyy"));

            if (grupo.Finalizado && grupo.FinalizadoEm.HasValue)
            {
                table.Cell().Element(CellStyle).Text("Finalizado em:").SemiBold();
                table.Cell().Element(CellStyle).Text(grupo.FinalizadoEm.Value.ToString("dd/MM/yyyy"));
            }
        });

        static IContainer CellStyle(IContainer container)
        {
            return container.Padding(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
        }
    }

    public static void MembersList(this IContainer container, Group grupo, ResumoFinanceiroDto resumoFinanceiro)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3);
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
            });

            // Header
            table.Header(header =>
            {
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Membro").FontColor(Colors.White).Bold());
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Função").FontColor(Colors.White).Bold());
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Saldo").FontColor(Colors.White).Bold());

                static IContainer HeaderStyle(IContainer container)
                {
                    return container.Padding(8).Background("#059669").ShowOnce();
                }
            });

            // Data
            foreach (var membro in grupo.Members)
            {
                var saldo = resumoFinanceiro.Saldos.ContainsKey(membro.UserId) ? resumoFinanceiro.Saldos[membro.UserId].Saldo : 0;
                var saldoColor = saldo >= 0 ? Colors.Green.Darken1 : Colors.Red.Darken1;

                table.Cell().Element(CellStyle).Text(membro.User?.Nome ?? "Desconhecido");
                table.Cell().Element(CellStyle).Text(membro.UserId == grupo.CreatorId ? "Administrador" : "Membro");
                table.Cell().Element(CellStyle).Text(text =>
                {
                    text.Span($"{(saldo >= 0 ? "+" : "")}{saldo:C}").FontColor(saldoColor).Bold();
                });
            }

            static IContainer CellStyle(IContainer container)
            {
                return container.Padding(8).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
            }
        });
    }

    public static void ExpensesTable(this IContainer container, ICollection<Expense> expenses)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3);
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
                columns.RelativeColumn(2);
            });

            // Header
            table.Header(header =>
            {
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Descrição").FontColor(Colors.White).Bold());
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Valor").FontColor(Colors.White).Bold());
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Pago por").FontColor(Colors.White).Bold());
                header.Cell().Element(HeaderStyle).Text(text => text.Span("Data").FontColor(Colors.White).Bold());

                static IContainer HeaderStyle(IContainer container)
                {
                    return container.Padding(8).Background("#059669").ShowOnce();
                }
            });

            // Data
            foreach (var despesa in expenses.OrderByDescending(e => e.Date))
            {
                table.Cell().Element(CellStyle).Text(despesa.Descricao);
                table.Cell().Element(CellStyle).Text(text =>
                {
                    text.Span(despesa.Amount.ToString("C")).FontColor("#059669").Bold();
                });
                table.Cell().Element(CellStyle).Text(despesa.PagadorNome);
                table.Cell().Element(CellStyle).Text(despesa.Date.ToString("dd/MM/yyyy"));
            }

            static IContainer CellStyle(IContainer container)
            {
                return container.Padding(8).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
            }
        });
    }

    public static void TransactionsList(this IContainer container, List<TransacaoSimplificadaDto> transactions)
    {
        container.Column(column =>
        {
            column.Spacing(10);

            foreach (var transacao in transactions)
            {
                column.Item().TransactionItem(transacao);
            }
        });
    }

    public static void TransactionItem(this IContainer container, TransacaoSimplificadaDto transacao)
    {
        container.Background("#fffbeb")
            .Padding(15)
            .Border(1)
            .BorderColor("#f59e0b")
            .BorderLeft(4)
            .Row(row =>
            {
                row.Spacing(10);
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text($"{transacao.DevedorNome} deve pagar para {transacao.CredorNome}")
                        .FontColor("#065f46").SemiBold();
                });
                row.AutoItem().Text(transacao.Valor.ToString("C"))
                    .FontColor("#065f46").Bold().FontSize(14);
            });
    }
}
