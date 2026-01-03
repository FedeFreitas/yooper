import { z } from 'zod'

export const monthEnum = z.enum([
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

export type Month = z.infer<typeof monthEnum>

export const errorSchema = z.object({
  message: z.string(),
})

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const investmentGoalBodySchema = z.object({
  name: z
    .string('O campo nome é obrigatório e deve ser uma string')
    .min(1, 'Nome é obrigatorio e não pode ser vazio')
    .max(20, 'Não é permitido mais de 20 caracteres no nome'),
  months: z
    .array(monthEnum, 'O mês é obrigatório e deve ser uma array')
    .nonempty('Informe pelo menos um mês')
    .max(12, 'Use no maximo 12 meses')
    .refine(
      (months) => new Set(months).size === months.length,
      'Meses nao podem se repetir',
    ),
  value: z
    .number('O Valor é obrigatório e deve ser um número positivo')
    .positive('Valor deve ser positivo'),
})

export const partialInvestmentGoalBodySchema = investmentGoalBodySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Informe ao menos um campo para atualizar' },
  )

export const investmentGoalResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  months: z.array(monthEnum),
  value: z.number(),
  monthlyValue: z.number(),
})

export const investmentGoalsListSchema = z.array(investmentGoalResponseSchema)
