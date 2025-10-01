# Panela Rateio - README

## 1. Arquitetura do Projeto

O projeto Panela Rateio é uma aplicação full-stack, estruturada com backend em C#, banco de dados PostgreSQL e frontend planejado em React Native para mobile. O sistema segue o padrão API REST, permitindo fácil integração entre plataformas.

### Tecnologias Utilizadas

| Camada             | Tecnologia                            | Função                                                                         |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| Backend            | C# + ASP.NET Core 9                   | Criação de API REST para autenticação, grupos, membros e despesas              |
| Banco de Dados     | PostgreSQL (Docker)                   | Armazenamento de usuários, grupos, membros, despesas e histórico de migrations |
| Autenticação       | JWT (JSON Web Token)                  | Proteção das rotas e validação de usuários autenticados                        |
| Documentação/Teste | Swagger / Postman                     | Teste e documentação de endpoints da API                                       |
| Frontend/Mobile    | React Native + TypeScript (planejado) | Tela de login, registro, configuração de chave PIX, grupos e despesas          |

## 2. Fluxo de Funcionamento do Sistema

### Experiência do Usuário

1. **Registro de Usuário**: Usuário cria conta com e-mail, senha e opcionalmente chave PIX. Dados são validados e armazenados com senha criptografada.
2. **Login**: Usuário entra com e-mail e senha, recebendo token JWT para autenticação em rotas protegidas.
3. **Gerenciamento de Grupos**: Usuários autenticados podem criar grupos e adicionar membros.
4. **Gerenciamento de Despesas**: Usuários do grupo criam despesas e definem a divisão entre membros (igual, percentual ou valor exato).

### Fluxo Visual Simplificado

```
Usuário -> Registro/Login -> Recebe JWT -> Criação de grupo -> Adiciona membros -> Criação de despesa -> Cálculo de rateio -> Visualização do saldo de cada membro
```

## 3. Tarefas Realizadas nas Duas Primeiras Sprints

### Sprint 1 – Setup Inicial e Backend

* Criação do projeto em C# (.NET 7 Web API)
* Instalação e configuração do PostgreSQL no Docker
* Criação do DbContext e modelos de dados (`User`, `Group`, `Member`, `Expense`, `Split`)
* Criação das migrations e aplicação no banco de dados
* Configuração do JWT para autenticação
* Configuração do Swagger para documentação de API

### Sprint 2 – Autenticação e Testes

* Implementação do AuthController com rotas de registro e login
* Teste completo de criação de usuários e login via Postman
* Ajuste de DateTime para UTC para compatibilidade com PostgreSQL
* Verificação das tabelas no banco e validação da persistência de dados

## 4. Link do GitHub Projects

[Link para o Kanban do Projeto](https://github.com/users/BragaNux/projects/3)
