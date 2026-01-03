import { z } from 'zod'
import { pool } from '../db'
import { FastifyTypedInstance } from '../types'

const monthEnum = z.enum([
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
])

type Month = z.infer<typeof monthEnum>


const errorSchema = z.object({
  message: z.string(),
})


const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

function mapGoalRow(row: {
  id: number
  name: string
  months: Month[] | string[]
  total_value: string
  monthly_value: string
}) {

  return {
    id: Number(row.id),
    name: row.name,
    months: row.months as Month[],
    value: Number(row.total_value),
    monthlyValue: Number(row.monthly_value),
  }
}

export async function investmentGoalsRoutes(app: FastifyTypedInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: "Criar meta de investimento",
        tags: ['InvestmentGoals'],
        description: "Cria uma nova meta de investimento dividindo o valor igualmente pelos meses informados.",
        body: z.object({
          name: z
            .string('O campo nome é obrigatório e deve ser uma string')
            .min(1, 'Nome é obrigatorio e não pode ser vazio')
            .max(20, 'Não é permitido mais de 20 caracteres no nome'),
          months: z
            .array(monthEnum, 'O mês é obrigatório e deve ser uma array')
            .nonempty('Informe pelo menos um mes')
            .max(12, 'Use no maximo 12 meses')
            .refine(
              (months) => new Set(months).size === months.length,
              'Meses nao podem se repetir',
            ),
          value: z.number('O Valor é obrigatório e deve ser um número positivo').positive('Valor deve ser positivo'),
        }),
        response: {
          201: z.object({
            id: z.number(),
            name: z.string(),
            months: z.array(monthEnum),
            value: z.number(),
            monthlyValue: z.number(),
          }),
          400: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, months, value } = request.body

      try {
        const monthlyValue = Number((value / months.length).toFixed(2))

        const insertQuery = `
          INSERT INTO investment_goals (name, months, total_value, monthly_value)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, months, total_value, monthly_value
        `

        const result = await pool.query(insertQuery, [
          name,
          months,
          value,
          monthlyValue,
        ])

        return reply.code(201).send(mapGoalRow(result.rows[0]))
      } catch (error) {
        request.log.error({ err: error }, 'Falha ao criar meta de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel criar a meta de investimento.' })
      }
    },
  )

  app.get(
    '/',
    {
      schema: {
        summary: "Listar metas de investimento",
        tags: ['InvestmentGoals'],
        description:
          "Retorna metas de investimento com filtros opcionais por nome (contem) e mes (igual).",
        querystring: z.object({
          name: z.string().optional(),
          month: monthEnum.optional(),
        }),
        response: {
          200: z.array(z.object({
            id: z.number(),
            name: z.string(),
            months: z.array(monthEnum),
            value: z.number(),
            monthlyValue: z.number(),
          })),
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, month } = request.query

      try {
        const conditions: string[] = []
        const values: (string | number)[] = []

        if (name) {
          values.push(`%${name}%`)
          conditions.push(`name ILIKE $${values.length}`)
        }

        if (month) {
          values.push(month)
          conditions.push(`$${values.length} = ANY(months)`)
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const query = `
          SELECT id, name, months, total_value, monthly_value
          FROM investment_goals
          ${where}
          ORDER BY id DESC
        `

        const result = await pool.query(query, values)

        return reply.status(200).send(result.rows.map(mapGoalRow))
      } catch (error) {
        request.log.error({ err: error }, 'Falha ao listar metas de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel listar as metas de investimento.' })
      }
    },
  )

  app.get(
    '/:id',
    {
      schema: {
        tags: ['InvestmentGoals'],
        summary: "Buscar meta por id",
        description: "Retorna uma meta de investimento pelo identificador.",
        params: idParamSchema,
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            months: z.array(monthEnum),
            value: z.number(),
            monthlyValue: z.number(),
          }),
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      try {
        const result = await pool.query(
          'SELECT id, name, months, total_value, monthly_value FROM investment_goals WHERE id = $1',
          [id],
        )

        if (!result.rows.length) {
          return reply.status(404).send({ message: 'Meta nao encontrada.' })
        }

        return reply.status(200).send(mapGoalRow(result.rows[0]))
      } catch (error) {
        request.log.error({ err: error }, 'Falha ao buscar meta de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel buscar a meta de investimento.' })
      }
    },
  )

  app.put(
    '/:id',
    {
      schema: {
        tags: ['InvestmentGoals'],
        summary: "Atualizar meta total",
        description:
          "Atualiza todos os campos de uma meta de investimento e recalcula o valor por mes.",
        params: idParamSchema,
        body: z.object({
          name: z
            .string('O campo nome é obrigatório e deve ser uma string')
            .min(1, 'Nome é obrigatorio e não pode ser vazio')
            .max(20, 'Não é permitido mais de 20 caracteres no nome'),
          months: z
            .array(monthEnum, 'O mês é obrigatório e deve ser uma array')
            .nonempty('Informe pelo menos um mes')
            .max(12, 'Use no maximo 12 meses')
            .refine(
              (months) => new Set(months).size === months.length,
              'Meses nao podem se repetir',
            ),
          value: z.number('O Valor é obrigatório e deve ser um número positivo').positive('Valor deve ser positivo'),
        }),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            months: z.array(monthEnum),
            value: z.number(),
            monthlyValue: z.number(),
          }),
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { name, months, value } = request.body

      try {
        const monthlyValue = Number((value / months.length).toFixed(2))

        const updateQuery = `
          UPDATE investment_goals
          SET name = $1, months = $2, total_value = $3, monthly_value = $4
          WHERE id = $5
          RETURNING id, name, months, total_value, monthly_value
        `

        const result = await pool.query(updateQuery, [
          name,
          months,
          value,
          monthlyValue,
          id,
        ])

        if (!result.rows.length) {
          return reply.status(404).send({ message: 'Meta nao encontrada.' })
        }

        return reply.status(200).send(mapGoalRow(result.rows[0]))

      } catch (error) {
        request.log.error({ err: error }, 'Falha ao atualizar meta de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel atualizar a meta de investimento.' })
      }
    },
  )
  app.patch(
    '/:id',
    {
      schema: {
        tags: ['InvestmentGoals'],
        summary: "Atualizar meta parcial",
        description:
          "Atualiza parcialmente uma meta de investimento escolhendo somente um campo e caso necessário recalcula o valor por mes.",
        params: idParamSchema,
        body: z.object({
          name: z
            .string('O campo nome é obrigatório e deve ser uma string')
            .min(1, 'Nome é obrigatorio e não pode ser vazio')
            .max(20, 'Não é permitido mais de 20 caracteres no nome'),
          months: z
            .array(monthEnum, 'O mês é obrigatório e deve ser uma array')
            .nonempty('Informe pelo menos um mes')
            .max(12, 'Use no maximo 12 meses')
            .refine(
              (months) => new Set(months).size === months.length,
              'Meses nao podem se repetir',
            ),
          value: z.number('O Valor é obrigatório e deve ser um número positivo').positive('Valor deve ser positivo'),
        }).partial().refine(
          (data) => Object.keys(data).length > 0,
          { message: 'Informe ao menos um campo para atualizar' }
        ),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            months: z.array(monthEnum),
            value: z.number(),
            monthlyValue: z.number(),
          }),
          400: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { name, months, value } = request.body

      try {
        const { rows: current } = await pool.query(
          'SELECT * FROM investment_goals WHERE id = $1',
          [id],
        )

        if (!current.length) {
          return reply.status(404).send({ message: 'Meta não encontrada' })
        }

        const updated = {
          name: name ?? current[0].name,
          months: months ?? current[0].months,
          value: value ?? Number(current[0].total_value),
        }

        const monthlyValue = Number(
          (updated.value / updated.months.length).toFixed(2),
        )

        const { rows } = await pool.query(
          `
          UPDATE investment_goals
          SET name = $1,
              months = $2,
              total_value = $3,
              monthly_value = $4
          WHERE id = $5
          RETURNING id, name, months, total_value, monthly_value
        `,
          [updated.name, updated.months, updated.value, monthlyValue, id],
        )

        return mapGoalRow(rows[0])
      } catch (error) {
        request.log.error({ err: error }, 'Falha ao atualizar meta de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel atualizar a meta de investimento.' })
      }
    },
  )
  app.delete(
    '/:id',
    {
      schema: {
        tags: ['InvestmentGoals'],
        summary: "Excluir meta",
        description: "Remove uma meta de investimento pelo identificador.",
        params: idParamSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      try {
        const result = await pool.query(
          'DELETE FROM investment_goals WHERE id = $1 RETURNING id',
          [id],
        )

        if (!result.rows.length) {
          return reply.status(404).send({ message: 'Meta nao encontrada.' })
        }

        return reply.status(200).send({
          message: 'Meta removida com sucesso'
        })
      } catch (error) {
        request.log.error({ err: error }, 'Falha ao deletar meta de investimento')
        return reply
          .status(500)
          .send({ message: 'Nao foi possivel deletar a meta de investimento.' })
      }
    },
  )
}
