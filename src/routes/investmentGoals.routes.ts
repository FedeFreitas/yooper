import { z } from "zod";
import {
  createInvestmentGoal,
  deleteInvestmentGoal,
  getInvestmentGoalById,
  listInvestmentGoals,
  patchInvestmentGoal,
  updateInvestmentGoal,
} from "../controllers/investmentGoalsController";
import {
  errorSchema,
  idParamSchema,
  investmentGoalBodySchema,
  investmentGoalResponseSchema,
  investmentGoalsListSchema,
  monthEnum,
  partialInvestmentGoalBodySchema,
} from "../schemas/investmentGoalSchemas";
import { FastifyTypedInstance } from "../types";

export async function investmentGoalsRoutes(app: FastifyTypedInstance) {
  app.post(
    "/",
    {
      schema: {
        summary: "Criar meta de investimento",
        tags: ["InvestmentGoals"],
        description:
          "API RESTful para criação, listagem, atualização e exclusão de metas de investimento.",
        body: investmentGoalBodySchema,
        response: {
          201: investmentGoalResponseSchema,
          400: errorSchema,
          500: errorSchema,
        },
      },
    },
    createInvestmentGoal
  );

  app.get(
    "/",
    {
      schema: {
        summary: "Listar metas de investimento",
        tags: ["InvestmentGoals"],
        description:
          "Retorna metas de investimento com filtros opcionais por nome (contém) e por mês (igual).",
        querystring: z.object({
          name: z.string().optional(),
          month: monthEnum.optional(),
        }),
        response: {
          200: investmentGoalsListSchema,
          500: errorSchema,
        },
      },
    },
    listInvestmentGoals
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["InvestmentGoals"],
        summary: "Buscar meta por id",
        description:
          "Retorna uma meta de investimento com base no identificador informado.",
        params: idParamSchema,
        response: {
          200: investmentGoalResponseSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    getInvestmentGoalById
  );

  app.put(
    "/:id",
    {
      schema: {
        tags: ["InvestmentGoals"],
        summary: "Atualizar meta total",
        description:
          "Atualiza todos os campos de uma meta de investimento e recalcula automaticamente o valor mensal.",
        params: idParamSchema,
        body: investmentGoalBodySchema,
        response: {
          200: investmentGoalResponseSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    updateInvestmentGoal
  );

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["InvestmentGoals"],
        summary: "Atualizar meta parcial",
        description:
          "Atualiza parcialmente uma meta de investimento, permitindo alterar apenas os campos informados e recalculando o valor mensal quando aplicável.",
        params: idParamSchema,
        body: partialInvestmentGoalBodySchema,
        response: {
          200: investmentGoalResponseSchema,
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    patchInvestmentGoal
  );

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["InvestmentGoals"],
        summary: "Excluir meta",
        description:
          "Remove uma meta de investimento com base no identificador informado.",
        params: idParamSchema,
        response: {
          200: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    deleteInvestmentGoal
  );
}
