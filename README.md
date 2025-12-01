# Panela

Aplicativo de rateio entre amigos para criar grupos, registrar despesas, dividir valores (rateio) e acompanhar saldos. Projeto composto por backend .NET e aplicativo mobile React Native.

## Visão Geral
- Backend: .NET 8 Web API, EF Core, PostgreSQL, JWT
- Mobile: React Native (Expo), TypeScript
- Deploy: Docker Compose; reverse proxy com Caddy para TLS
- API pública: `https://api.panela.host/api`

## Infra em Produção
- Backend: contêineres Docker rodando em VM Linux (Caddy + API)
- Reverse Proxy/HTTPS: Caddy com certificados automáticos (Let’s Encrypt)
- Banco de Dados: PostgreSQL gerenciado (variável `DATABASE_URL`); acesso restrito
- E-mail (SMTP): `smtp.hostinger.com` porta `587` com STARTTLS
- Armazenamento estático: avatares em `wwwroot/avatars` (criados no startup)

## Funcionalidades
- Criação e gerenciamento de grupos de despesas
- Registro de despesas com pagador e participantes
- Rateio e cálculo automático por grupo
- Convites de amizade e lista de amigos
- Notificações de eventos (convites, ações em grupo)
- Recuperação e redefinição de senha por e-mail
- Perfil do usuário (dados e alteração de senha)

## Telas do Mobile
- Login (`src/screens/LoginScreen.tsx`): autenticação por e-mail/senha
- Registro (`src/screens/RegisterScreen.tsx`): criar conta, incluir Chave PIX
- Esqueci a Senha (`src/screens/ForgotPasswordScreen.tsx`): solicitar e redefinir
- Dashboard (`src/screens/DashboardScreen.tsx`): visão geral e atalhos
- Grupos (`src/screens/GroupsListScreen.tsx`): lista de grupos
- Detalhe do Grupo (`src/screens/GroupDetailScreen.tsx`): despesas, membros, exportações
- Criar Grupo (`src/screens/CreateGroupScreen.tsx`)
- Adicionar Membro (`src/screens/AddMemberScreen.tsx`)
- Adicionar Despesa (`src/screens/AddExpenseScreen.tsx`)
- Detalhe da Despesa (`src/screens/ExpenseDetailScreen.tsx`)
- Resumo de Despesas (`src/screens/ExpensesSummaryScreen.tsx`)
- Grupo Finalizado (`src/screens/FinalizedGroupScreen.tsx`)
- Amigos (`src/screens/FriendsScreen.tsx`) e Detalhe de Amigo (`src/screens/FriendDetailScreen.tsx`)
- Notificações (`src/screens/NotificationsScreen.tsx`)
- Rateio (`src/screens/RateioScreen.tsx`): ajustes e visão do rateio
- Perfil (`src/screens/ProfileScreen.tsx`): dados pessoais e senha

## API e Serviços
- Autenticação: JWT (`JWT_SECRET` obrigatório em produção)
- Healthcheck: `GET /api/health`, `GET /api/health/db`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/smtp-test?email=...`
- Grupos: `GET /api/groups`, `GET /api/groups/{id}`, `POST /api/groups`, `PUT /api/groups/{id}`, `DELETE /api/groups/{id}`
- Membros/Convites: `POST /api/groups/{id}/members`, `POST /api/groups/{id}/join`
- Despesas: `POST /api/expenses`, `GET /api/expenses/group/{groupId}`
- Rateio: `GET /api/rateio/group/{groupId}`
- Amizades/Notificações: endpoints em `Friends` e `Notifications`

## Banco de Dados
- Principais tabelas: `Users`, `Groups`, `Members`, `Expenses`, `Splits`, `FriendRequests`, `Friendships`, `Notifications`, `PasswordResets`
- Índices e FKs conforme scripts e migrations
- Criação idempotente de `PasswordResets` no startup (`panela_backend/Program.cs:162`) para evitar falhas de recuperação

## Responsividade e UX (Mobile)
- Inputs padronizados: largura 100% e altura 52 (login como referência)
- Campo Chave PIX ampliado (altura 56, fonte 14) para placeholder longo (`RegisterScreen.tsx:175`)
- Campo E-mail de Esqueceu Senha com layout idêntico ao login (`ForgotPasswordScreen.tsx:167`)
- Modal de feedback após redefinição de senha (`ForgotPasswordScreen.tsx:109`)

## Configuração da API no Mobile
- Arquivo: `src/config/api.ts`
- Por padrão, usa configuração manual (`USE_MANUAL_CONFIG=true`): `http://192.168.100.10:8080/api`
- Para produção, ajuste para apontar para `https://api.panela.host/api` via variável `EXPO_PUBLIC_API_URL` ou desativando o modo manual
- Cliente HTTP: `src/services/api.ts` (Axios) com interceptors

## Execução Local (Dev)
- Backend via Docker Compose (raiz): `docker compose up --build`
- Swagger (dev): `http://localhost:8080/swagger`
- Health: `http://localhost:8080/api/health`

## Deploy (Produção)
- Arquivos: `panela_backend/deploy/docker-compose.yml`, `panela_backend/deploy/Caddyfile`
- Variáveis: `DATABASE_URL`, `JWT_SECRET`, `ENABLE_SCHEMA_CHECK=false`, `CORS_ORIGIN`, `DOMAIN`, `EMAIL`
- Subir: `cd panela_backend/deploy` e `docker compose up -d`

## Segurança
- `JWT_SECRET` forte e rotacionável
- CORS restrito (`CORS_ORIGIN`)
- Sem exposição de credenciais no repositório

## Build Android (Release)
- Pré-requisitos: Android SDK/JDK
- Comando: no diretório `panela_mobile/android` executar `./gradlew.bat assembleRelease`
- Saída: `panela_mobile/android/app/build/outputs/apk/release/app-release.apk`
- Instalação (ADB): `adb install -r panela_mobile/android/app/build/outputs/apk/release/app-release.apk`

## Estrutura de Pastas
- `panela_backend/` (API .NET)
- `panela_mobile/` (app React Native)
- `docker-compose.yml` (dev)
- `.env`
