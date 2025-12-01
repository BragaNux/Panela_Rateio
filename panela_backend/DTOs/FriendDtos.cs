namespace Panela.Api.DTOs;

public record EnviarSolicitacaoAmizadeDto(
    string ReceiverEmail
);

public record ResponderSolicitacaoAmizadeDto(
    Guid RequestId,
    bool Aceitar
);

public record SolicitacaoAmizadeDto(
    Guid Id,
    Guid SenderId,
    string SenderNome,
    Guid ReceiverId,
    string ReceiverNome,
    string Status,
    DateTime CreatedAt
);

public record AmigoDto(
    Guid Id,
    string Nome,
    string Email,
    DateTime FriendshipDate
);