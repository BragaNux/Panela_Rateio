# Panela — App de Rateio (Planejamento)

> Documento para o professor com **ideia e planejamento** (sem código). Inclui objetivo, funcionamento, público-alvo, tecnologias, mockups (descritos) e guia de navegação.

## 1) Objetivo Geral
Facilitar a divisão de despesas em grupo (churrascos, viagens, encontros), calculando automaticamente quanto cada pessoa deve pagar/receber e gerando **transferências mínimas** com **QR Code PIX** por pessoa.

**Metas do MVP**
- Fechar um rateio em **< 2 minutos** após o último lançamento de despesa.
- Interface direta, offline-first e focada em poucos toques.

## 2) Ideia Geral de Funcionamento e Público-Alvo
**Fluxo**
1. Criar grupo (ex.: “Viagem Floripa”) e adicionar membros (nome + chave PIX opcional).
2. Lançar despesas com quem pagou, valor e forma de divisão: **Igual | Percentual | Exatos**.
3. App calcula saldos e gera a **lista de acertos** (quem paga quem, com mínimo de transferências).
4. Cada devedor abre um **QR Code PIX** com o valor exato; compartilhar resumo por link/texto.

**Público-Alvo**
- Grupos de amigos/família (rolês pontuais, churrascos, viagens).
- Repúblicas/apartamentos estudantis (contas mensais simples).
- Times de futebol/academias (rateios ocasionais).

## 3) Tecnologias a serem usadas (React Native com TS obrigatório)
- **React Native + TypeScript (Expo)** — obrigatório.
- **SQLite** para persistência local (offline-first).
- **Zustand ou Context API** para estado.
- **Zod** para validação de formulários e tipos.
- **QR Code** lib compatível com Expo.
- Operações monetárias em **centavos** (inteiros).

> MVP sem backend. Futuras versões: API para sincronização multi-dispositivo.

## 4) Mockup das Telas, Cores, Layout e Navegação
### Paleta & Estilo
- Primária `#4F46E5` (índigo), Secundária `#06B6D4` (ciano)
- Neutros `#111827` (texto), `#6B7280` (texto secundário), `#F3F4F6` (fundos), `#FFFFFF` (cartões)
- Feedback: Sucesso `#10B981`, Aviso `#F59E0B`, Erro `#EF4444`
- Tipografia: Inter/Roboto; títulos semibold, corpo regular; contraste AA.

### Navegação
- Stack Navigator simples; dentro de Grupo, abas **Saldos | Despesas**.

### Telas (wireframe textual)
1) **Home (Grupos)** — lista de grupos + FAB “Novo Grupo”
2) **Criar/Editar Grupo** — nome + lista de membros (nome, apelido, PIX)
3) **Detalhes do Grupo** — aba **Saldos** (chips devedor/credor/ok), aba **Despesas** (lista + “+ Despesa”)
4) **Nova Despesa** — descrição, valor (centavos), pagador, data; divisão Igual/Percentual/Exatos; seleção de participantes
5) **Acertos (Quem paga quem)** — “Fulano → Sicrana: R$ X,XX”; ações: **PIX/QR**, **Copiar**, **Compartilhar**
6) **QR PIX** — QR + valor + “copia e cola”

## 5) Links Solicitados
- **Documento (README)**: este arquivo.
- **Figma (Starter/Placeholder)**: https://www.figma.com/make/igl6p8uncLiiKWTUCULZqJ/Panela-App-Mobile?fullscreen=1

---
© 2025 — Planejamento MVP Panela — sem código
