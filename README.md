# Yooper - Investment Goals API

API RESTful para criar, listar, atualizar e excluir metas de investimento, construída com Fastify + TypeScript e PostgreSQL, organizada em uma estrutura MVC simples.

## Tecnologias
- Node.js 20, Fastify 5, Zod, PostgreSQL 16
- Swagger UI em `/docs`
- TypeScript + tsx para desenvolvimento

## Como rodar localmente
1. Copie o env: `cp .env.example .env` e ajuste `DATABASE_URL`, `HOST`, `PORT`.
2. Instale deps: `npm ci`.
3. Prepare o banco: `psql "$env:DATABASE_URL" -f db/init.sql` (no Windows PowerShell) ou equivalente no seu shell.
4. Desenvolvimento: `npm run dev`.
5. Produção: `npm run build && npm start`.

## Como rodar com Docker
- Subir tudo: `docker-compose up --build`.
- Servicos: API em `http://localhost:3000`, Postgres em `localhost:5432` (user: postgres / senha: postgres / db: yooper). O script `db/init.sql` e executado automaticamente.

## Endpoints principais
- `GET /` - health check.
- `GET /docs` - Swagger UI.
- `POST /investment-goals` - cria meta.
  - Body exemplo:
    ```json
    {
      "name": "Reserva viagem",
      "months": ["JAN", "FEV", "MAR"],
      "value": 1500
    }
    ```
- `GET /investment-goals` - lista metas (filtros `name`, `month`).
- `GET /investment-goals/:id` - busca por id.
- `PUT /investment-goals/:id` - atualiza tudo (recalcula `monthlyValue`).
- `PATCH /investment-goals/:id` - atualiza parcial (recalcula se necessario).
- `DELETE /investment-goals/:id` - remove meta.

## Estrutura
- `src/server.ts`: boot do Fastify, CORS, Swagger, health check.
- `src/routes/investmentGoals.routes.ts`: definição das rotas e ligação com controllers.
- `src/controllers/investmentGoalsController.ts`: regras de cada endpoint.
- `src/models/investmentGoalModel.ts`: acesso ao Postgres e mapeamento das metas.
- `src/schemas/investmentGoalSchemas.ts`: schemas Zod para validações e respostas.
- `src/db.ts`: conexão com Postgres via `DATABASE_URL`.
- `db/init.sql`: DDL e triggers de `investment_goals`.

## Scripts npm
- `npm run dev`: desenvolvimento com recarga (tsx).
- `npm run build`: compilação TypeScript.
- `npm start`: executa build compilado.

## Licenca
ISC
