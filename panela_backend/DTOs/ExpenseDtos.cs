namespace Panela.Api.DTOs;

public record CriarDespesaDto(
    Guid GroupId,
    string Descricao,
    decimal Valor,
    DateTime? Data,
    string PagadorNome,
    List<SplitDto>? Splits
);

public record SplitDto(
    Guid UserId,
    string Mode,
    decimal ShareValue
);
