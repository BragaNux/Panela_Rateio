using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;
using Panela.Api.DTOs;
using Panela.Api.Models;

namespace Panela.Api.Services;

public class FriendService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notifications;
    
    public FriendService(AppDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<SolicitacaoAmizadeDto?> EnviarSolicitacaoAsync(Guid senderId, string receiverEmail)
    {
        // Buscar usuário destinatário
        var receiver = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == receiverEmail.ToLower());
        if (receiver == null)
            return null;

        // Verificar se já são amigos
        var jaAmigos = await _db.Friendships.AnyAsync(f => 
            (f.UserId1 == senderId && f.UserId2 == receiver.Id) ||
            (f.UserId1 == receiver.Id && f.UserId2 == senderId));
        
        if (jaAmigos)
            return null;

        // Verificar se já existe solicitação pendente
        var solicitacaoExistente = await _db.FriendRequests
            .FirstOrDefaultAsync(fr => 
                ((fr.RemetenteId == senderId && fr.DestinatarioId == receiver.Id) ||
                 (fr.RemetenteId == receiver.Id && fr.DestinatarioId == senderId)) &&
                fr.Status == "pendente");
        
        if (solicitacaoExistente != null)
            return null;

        // Criar nova solicitação
        var solicitacao = new FriendRequest
        {
            RemetenteId = senderId,
            DestinatarioId = receiver.Id,
            Status = "pendente",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.FriendRequests.Add(solicitacao);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(senderId);
        if (sender != null)
            await _notifications.AddAsync(receiver.Id, "friend_request", $"Você recebeu uma solicitação de amizade de {sender.Nome}");
        
        return new SolicitacaoAmizadeDto(
            solicitacao.Id,
            solicitacao.RemetenteId,
            sender?.Nome ?? "Desconhecido",
            solicitacao.DestinatarioId,
            receiver.Nome,
            solicitacao.Status,
            solicitacao.CreatedAt
        );
    }

    public async Task<List<SolicitacaoAmizadeDto>> ObterSolicitacoesPendentesAsync(Guid userId)
    {
        var solicitacoes = await _db.FriendRequests
            .Where(fr => fr.DestinatarioId == userId && fr.Status == "pendente")
            .Include(fr => fr.Remetente)
            .Include(fr => fr.Destinatario)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync();

        return solicitacoes.Select(s => new SolicitacaoAmizadeDto(
            s.Id,
            s.RemetenteId,
            s.Remetente?.Nome ?? "Desconhecido",
            s.DestinatarioId,
            s.Destinatario?.Nome ?? "Desconhecido",
            s.Status,
            s.CreatedAt
        )).ToList();
    }

    public async Task<List<SolicitacaoAmizadeDto>> ObterSolicitacoesEnviadasAsync(Guid userId)
    {
        var solicitacoes = await _db.FriendRequests
            .Where(fr => fr.RemetenteId == userId)
            .Include(fr => fr.Remetente)
            .Include(fr => fr.Destinatario)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync();

        return solicitacoes.Select(s => new SolicitacaoAmizadeDto(
            s.Id,
            s.RemetenteId,
            s.Remetente?.Nome ?? "Desconhecido",
            s.DestinatarioId,
            s.Destinatario?.Nome ?? "Desconhecido",
            s.Status,
            s.CreatedAt
        )).ToList();
    }

    public async Task<bool> ResponderSolicitacaoAsync(Guid requestId, Guid userId, bool aceitar)
    {
        var solicitacao = await _db.FriendRequests
            .Include(fr => fr.Remetente)
            .Include(fr => fr.Destinatario)
            .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.DestinatarioId == userId);

        if (solicitacao == null || solicitacao.Status != "pendente")
            return false;

        solicitacao.Status = aceitar ? "aceito" : "recusado";
        solicitacao.UpdatedAt = DateTime.UtcNow;

        if (aceitar)
        {
            // Criar amizade
            var friendship = new Friendship
            {
                UserId1 = solicitacao.RemetenteId < solicitacao.DestinatarioId ? solicitacao.RemetenteId : solicitacao.DestinatarioId,
                UserId2 = solicitacao.RemetenteId > solicitacao.DestinatarioId ? solicitacao.RemetenteId : solicitacao.DestinatarioId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Friendships.Add(friendship);
        }

        await _db.SaveChangesAsync();

        if (aceitar)
        {
            var remetente = solicitacao.Remetente;
            var destinatario = solicitacao.Destinatario;
            if (remetente != null && destinatario != null)
            {
                await _notifications.AddAsync(remetente.Id, "friend_request_accepted", $"{destinatario.Nome} aceitou sua solicitação de amizade");
            }
        }
        return true;
    }

    public async Task<List<AmigoDto>> ObterAmigosAsync(Guid userId)
    {
        var amizades = await _db.Friendships
            .Where(f => f.UserId1 == userId || f.UserId2 == userId)
            .Include(f => f.User1)
            .Include(f => f.User2)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return amizades.Select(f =>
        {
            var amigo = f.UserId1 == userId ? f.User2 : f.User1;
            return new AmigoDto(
                amigo?.Id ?? Guid.Empty,
                amigo?.Nome ?? "Desconhecido",
                amigo?.Email ?? "",
                f.CreatedAt
            );
        }).ToList();
    }

    public async Task<bool> AceitarSolicitacaoAsync(Guid requestId)
    {
        var solicitacao = await _db.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (solicitacao == null) return false;
        solicitacao.Status = "aceito";
        solicitacao.UpdatedAt = DateTime.UtcNow;
        var amizade = new Friendship
        {
            UserId1 = solicitacao.RemetenteId,
            UserId2 = solicitacao.DestinatarioId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Friendships.Add(amizade);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RecusarSolicitacaoAsync(Guid requestId)
    {
        var solicitacao = await _db.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (solicitacao == null) return false;
        solicitacao.Status = "recusado";
        solicitacao.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }
    public async Task<bool> RemoverAmigoAsync(Guid userId, Guid friendId)
    {
        var amizade = await _db.Friendships
            .FirstOrDefaultAsync(f => 
                (f.UserId1 == userId && f.UserId2 == friendId) ||
                (f.UserId1 == friendId && f.UserId2 == userId));

        if (amizade == null)
            return false;

        _db.Friendships.Remove(amizade);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(User? amigo, DateTime? friendshipDate)> ObterAmigoAsync(Guid currentUserId, Guid amigoId)
    {
        var amizade = await _db.Friendships
            .Include(f => f.User1)
            .Include(f => f.User2)
            .FirstOrDefaultAsync(f => (f.UserId1 == currentUserId && f.UserId2 == amigoId) || (f.UserId2 == currentUserId && f.UserId1 == amigoId));
        if (amizade == null) return (null, null);
        var amigo = amizade.UserId1 == currentUserId ? amizade.User2 : amizade.User1;
        return (amigo, amizade.CreatedAt);
    }
}
