namespace Panela.Api.DTOs;

public record CriarGrupoDto(
    string Nome,
    string Descricao,
    List<Guid>? MembrosUserIds
);

public record AtualizarGrupoDto(
    string Nome,
    string Descricao
);

public record GrupoDto(
    Guid Id,
    string Nome,
    string Descricao,
    Guid CreatorId,
    bool Finalizado,
    DateTime? FinalizadoEm,
    DateTime CriadoEm
);

public record EntrarGrupoDto(Guid GroupId);
public record AdicionarMembroDto(Guid UserId);
