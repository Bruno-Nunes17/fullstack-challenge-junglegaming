# Desafio Full-stack - Crash Game 🚀

Este projeto é uma implementação de um **Crash Game** multiplayer em tempo real, desenvolvido para o desafio técnico da **Jungle Gaming**. O sistema foi construído utilizando uma arquitetura de microserviços, orientada a eventos e baseada nos princípios do **Domain-Driven Design (DDD)**.

---

## 🏗️ Arquitetura do Sistema

O ecossistema é composto por microserviços isolados que se comunicam de forma assíncrona:

1. **Game Service (NestJS)**:
    * Gerencia o ciclo de vida das rodadas (`Round`) e das apostas (`Bet`).
    * Implementa o algoritmo de **Provably Fair**.
    * Orquestra o **Game Loop** (fases de espera, início, progresso e crash).
    * Mantém a comunicação em tempo real via **WebSockets (Socket.io)**.
2. **Wallet Service (NestJS)**:
    * Gerencia o saldo dos jogadores.
    * Garante **precisão monetária** absoluta utilizando `BIGINT` para representar valores em centavos.
    * Processa créditos e débitos de forma atômica.
3. **API Gateway (Kong)**:
    * Roteia todas as requisições externas para os serviços internos através da porta `8000`.
    * Gerencia políticas de **CORS** centralizadamente.
4. **Identity Provider (Keycloak)**:
    * Gerencia a autenticação e autorização via **OIDC**.
    * O realm `crash-game` é importado automaticamente no setup.
5. **Message Broker (RabbitMQ)**:
    * Facilita a comunicação desacoplada entre os serviços usando padrões de mensageria (Pub/Sub).

---

## 🎲 Regras e Lógica do Jogo

As seguintes regras foram rigorosamente implementadas:

* **Fase de Apostas (10s)**: Apenas neste período os jogadores podem colocar apostas.
* **Aposta Única**: Cada jogador pode realizar apenas uma aposta por rodada.
* **Limites de Aposta**: Mínimo de R$ 1,00 e Máximo de R$ 1.000,00.
* **Multiplicador**: Inicia em `1.00x` e sobe exponencialmente (`e^(0.06 * t)`).
* **Cash Out**: O jogador pode sacar a qualquer momento durante a subida. Se o multiplicador atingir o ponto de crash antes do saque, a aposta é perdida.

---

## 🔐 Algoritmo Provably Fair

Para garantir a transparência, o ponto de crash é calculado de forma determinística:

1. No início da rodada, gera-se um `serverSeed` (aleatório) e um `clientSeed` (fixo).
2. O **Crash Point** é calculado via `HMAC-SHA256(serverSeed, clientSeed)`.
3. O **Hash do Server Seed** é enviado aos clientes antes da rodada começar.
4. Após o crash, o `serverSeed` original é revelado, permitindo a verificação manual da integridade do resultado através do endpoint de verificação.

---

## 📡 Referência Técnica (API & WebSocket)

### REST Endpoints (via Kong :8000)

| Serviço | Método | Endpoint | Descrição |
| :--- | :--- | :--- | :--- |
| **Wallets** | `POST` | `/wallets` | Cria carteira para o jogador autenticado. |
| **Wallets** | `GET` | `/wallets/me` | Retorna saldo e info da carteira do usuário logado. |
| **Games** | `GET` | `/games/rounds/current` | Retorna o estado atual da rodada ativa. |
| **Games** | `GET` | `/games/rounds/history` | Retorna o histórico das últimas 20 rodadas. |
| **Games** | `POST` | `/games/bet` | Realiza uma aposta (valor em BRL). |
| **Games** | `POST` | `/games/bet/cashout` | Realiza o saque no multiplicador atual. |
| **Games** | `GET` | `/games/rounds/:id/verify` | Retorna dados para verificação Provably Fair. |
| **Games** | `GET` | `/games/bets/me` | Histórico de apostas do jogador logado. |

### Eventos WebSocket (Server -> Client)

| Evento | Payload | Descrição |
| :--- | :--- | :--- |
| `round_waiting` | `{ id, duration, serverSeedHash }` | Início da fase de apostas. |
| `round_starting` | `{ id, duration }` | Fim das apostas, preparando subida. |
| `round_progress_start` | `{ id }` | O multiplicador começou a subir. |
| `multiplier_update` | `{ multiplier }` | Atualização do valor do multiplicador (real-time). |
| `round_crashed` | `{ id, multiplier, serverSeed }` | A rodada crashou. |
| `bet_placed` | `{ playerId, username, amount, betId }` | Um novo jogador entrou na rodada. |
| `bet_cashed_out` | `{ playerId, multiplier, payout }` | Um jogador realizou o saque. |
| `balance_updated` | `{ playerId }` | Notificação de que o saldo mudou (débito ou crédito). |

---

## ✉️ Mensageria (RabbitMQ)

A comunicação entre `Game` e `Wallet` utiliza os seguintes padrões definidos no pacote compartilhado `@crash/contracts`:

* `debit_wallet`: Enviado pelo Game para solicitar o desconto do valor da aposta.
* `credit_wallet`: Enviado pelo Game após um Cash Out bem-sucedido.
* `wallet_debited` / `wallet_credited`: Confirmações enviadas pela Wallet para gatilhos de sincronização.

---

## ⚙️ Setup e Execução

### Pré-requisitos

* [Bun](https://bun.sh/) >= 1.x
* [Docker](https://www.docker.com/) & Docker Compose

### Início Rápido

1. Instale as dependências: `bun install`
2. Suba o ambiente completo: `bun run docker:up`
3. Acesse: `http://localhost:3000`

### Credenciais de Teste (Keycloak)

* **User**: `player` / **Pass**: `player123`
* **Saldo Inicial**: R$ 1.000,00 (creditado automaticamente no primeiro login ou criação via POST).

---

## 🛠️ Painéis Administrativos e Infraestrutura

Para fins de avaliação e depuração, os seguintes painéis estão disponíveis:

| Ferramenta | URL | Credenciais |
| :--- | :--- | :--- |
| **Keycloak Admin** | `http://localhost:8080` | `admin` / `admin` |
| **RabbitMQ Management** | `http://localhost:15672` | `admin` / `admin` |
| **PostgreSQL** | `localhost:5432` | `admin` / `admin` (DB: `postgres`, `games`, `wallets`) |
| **Kong Admin API** | `http://localhost:8001` | N/A |

---

## ⚖️ Critérios de Avaliação Atendidos

* ✅ **Precisão Monetária**: Uso estrito de `BigInt` e centavos inteiros em toda a lógica financeira (sem ponto flutuante).
* ✅ **Comunicação Assíncrona**: Uso de RabbitMQ para desacoplar a engine do jogo do gerenciamento de saldo.
* ✅ **Real-time**: Multiplicador, histórico e saldo sincronizados via WebSockets com otimização de re-renders (Zustand Selectors).
* ✅ **Provably Fair**: Algoritmo HMAC-SHA256 implementado com revelação transparente de seeds.
* ✅ **Infrastructure as Code**: Setup 100% automatizado via Docker Compose, incluindo health checks customizados (`wget`).
* ✅ **Segurança**: Backend valida JWTs (RS256) emitidos pelo Keycloak, lidando com resolução de host interno vs externo no Docker.
* ✅ **Frontend de Cassino**: Estética dark/neon moderna, animações suaves com `framer-motion` e curva de multiplicador com glow neon.

---

Desenvolvido por Bruno Nunes como parte do processo seletivo da Jungle Gaming. 🦧
