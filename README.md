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
    * Gerencia políticas de **CORS** e **Rate Limiting** centralizadamente.
4. **Identity Provider (Keycloak)**:
    * Gerencia a autenticação e autorização via **OIDC**.
    * O realm `crash-game` é importado automaticamente no setup.
5. **Message Broker (RabbitMQ)**:
    * Facilita a comunicação desacoplada entre os serviços usando padrões de mensageria (Pub/Sub).

---

## ⭐ Diferenciais Implementados (Bônus)

Esta entrega foi além dos requisitos básicos, incluindo as seguintes funcionalidades de alto valor:

* 🤖 **Auto Bet**: Funcionalidade de participação automática em rodadas consecutivas.
* 💸 **Auto Cashout**: Jogador define um multiplicador alvo para saque automático pelo servidor.
* 🔊 **Efeitos Sonoros**: Experiência imersiva com áudio sintetizado via Web Audio API (zero latência e sem arquivos externos).
* 🛡️ **Rate Limiting**: Proteção de API configurada no Gateway para evitar abusos e bots.
* 🚀 **Pipeline de CI**: Integração contínua via GitHub Actions validando Lint, Types e Testes Unitários em cada push.
* 🧮 **Transparência Matemática**: Exibição da fórmula da curva exponencial (`e^(0.06 * t)`) diretamente na UI.
* 📉 **Física de Gráfico Real**: Curva côncava matematicamente precisa com linhas guia dinâmicas de tempo e multiplicador.

---

## 🎲 Regras e Lógica do Jogo

* **Fase de Apostas (10s)**: Apenas neste período os jogadores podem colocar apostas.
* **Aposta Única**: Cada jogador pode realizar apenas uma aposta por rodada.
* **Limites de Aposta**: Mínimo de R$ 1,00 e Máximo de R$ 1.000,00.
* **Multiplicador**: Inicia em `1.00x` e sobe exponencialmente conforme a fórmula exibida.
* **Cash Out**: O saque pode ser manual ou automático. Se o crash ocorrer antes do saque, a aposta é perdida.

---

## 🔐 Algoritmo Provably Fair

Para garantir a transparência, o ponto de crash é calculado de forma determinística:

1. No início da rodada, gera-se um `serverSeed` (aleatório) e um `clientSeed` (fixo).
2. O **Crash Point** é calculado via `HMAC-SHA256(serverSeed, clientSeed)`.
3. O **Hash do Server Seed** é enviado aos clientes antes da rodada começar.
4. Após o crash, o `serverSeed` original é revelado, permitindo a verificação manual no endpoint `/games/rounds/:id/verify`.

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
| **Games** | `GET` | `/games/rounds/:id/verify` | Dados para verificação Provably Fair. |

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
* **Saldo Inicial**: R$ 1.000,00 (creditado automaticamente no primeiro login).

---

## ⚖️ Critérios de Avaliação Atendidos

* ✅ **Precisão Monetária**: Uso estrito de `BigInt` e centavos inteiros (sem ponto flutuante).
* ✅ **Comunicação Assíncrona**: Uso de RabbitMQ para desacoplar a engine do jogo.
* ✅ **Real-time**: Sincronização via WebSockets com otimização de re-renders.
* ✅ **Segurança**: Backend valida JWTs (RS256) com resolução de rede Docker.
* ✅ **Qualidade de Código**: 100% Strict TypeScript, zero `any` e 100% livre de comentários inúteis.

---

Desenvolvido por Bruno Nunes como parte do processo seletivo da Jungle Gaming. 🦧
