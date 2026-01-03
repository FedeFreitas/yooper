import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  idParamSchema,
  Month,
  investmentGoalBodySchema,
  partialInvestmentGoalBodySchema,
} from '../schemas/investmentGoalSchemas'
import {
  insertGoal,
  listGoals,
  findGoalById,
  updateGoal,
  patchGoal,
  removeGoal,
} from '../models/investmentGoalModel'

type CreateRequest = FastifyRequest<{
  Body: z.infer<typeof investmentGoalBodySchema>
}>

type ListRequest = FastifyRequest<{
  Querystring: {
    name?: string
    month?: Month
  }
}>

type IdRequest = FastifyRequest<{
  Params: z.infer<typeof idParamSchema>
}>

type UpdateRequest = FastifyRequest<{
  Params: z.infer<typeof idParamSchema>
  Body: z.infer<typeof investmentGoalBodySchema>
}>

type PatchRequest = FastifyRequest<{
  Params: z.infer<typeof idParamSchema>
  Body: z.infer<typeof partialInvestmentGoalBodySchema>
}>

export async function createInvestmentGoal(
  request: CreateRequest,
  reply: FastifyReply,
) {
  const { name, months, value } = request.body

  try {
    const monthlyValue = Number((value / months.length).toFixed(2))
    const goal = await insertGoal({ name, months, value, monthlyValue })

    return reply.code(201).send(goal)
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao criar meta de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível criar a meta de investimento.' })
  }
}

export async function listInvestmentGoals(
  request: ListRequest,
  reply: FastifyReply,
) {
  const { name, month } = request.query

  try {
    const goals = await listGoals({ name, month })

    return reply.status(200).send(goals)
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao listar metas de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível listar as metas de investimento.' })
  }
}

export async function getInvestmentGoalById(
  request: IdRequest,
  reply: FastifyReply,
) {
  const { id } = request.params

  try {
    const goal = await findGoalById(id)

    if (!goal) {
      return reply.status(404).send({ message: 'Meta não encontrada.' })
    }

    return reply.status(200).send(goal)
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao buscar meta de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível buscar a meta de investimento.' })
  }
}

export async function updateInvestmentGoal(
  request: UpdateRequest,
  reply: FastifyReply,
) {
  const { id } = request.params
  const { name, months, value } = request.body

  try {
    const monthlyValue = Number((value / months.length).toFixed(2))

    const goal = await updateGoal({
      id,
      name,
      months,
      value,
      monthlyValue,
    })

    if (!goal) {
      return reply.status(404).send({ message: 'Meta não encontrada.' })
    }

    return reply.status(200).send(goal)
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao atualizar meta de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível atualizar a meta de investimento.' })
  }
}

export async function patchInvestmentGoal(
  request: PatchRequest,
  reply: FastifyReply,
) {
  const { id } = request.params
  const { name, months, value } = request.body

  try {
    const goal = await patchGoal({ id, name, months, value })

    if (!goal) {
      return reply.status(404).send({ message: 'Meta não encontrada' })
    }

    return reply.status(200).send(goal)
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao atualizar meta de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível atualizar a meta de investimento.' })
  }
}

export async function deleteInvestmentGoal(
  request: IdRequest,
  reply: FastifyReply,
) {
  const { id } = request.params

  try {
    const deleted = await removeGoal(id)

    if (!deleted) {
      return reply.status(404).send({ message: 'Meta não encontrada.' })
    }

    return reply.status(200).send({
      message: 'Meta removida com sucesso',
    })
  } catch (error) {
    request.log.error({ err: error }, 'Falha ao deletar meta de investimento')
    return reply
      .status(500)
      .send({ message: 'Não foi possível deletar a meta de investimento.' })
  }
}
