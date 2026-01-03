import { pool } from '../db'
import { Month } from '../schemas/investmentGoalSchemas'

export type InvestmentGoal = {
  id: number
  name: string
  months: Month[]
  value: number
  monthlyValue: number
}

type InvestmentGoalRow = {
  id: number
  name: string
  months: Month[] | string[]
  total_value: string
  monthly_value: string
}

const mapGoalRow = (row: InvestmentGoalRow): InvestmentGoal => ({
  id: Number(row.id),
  name: row.name,
  months: row.months as Month[],
  value: Number(row.total_value),
  monthlyValue: Number(row.monthly_value),
})

export async function insertGoal(data: {
  name: string
  months: Month[]
  value: number
  monthlyValue: number
}): Promise<InvestmentGoal> {
  const insertQuery = `
    INSERT INTO investment_goals (name, months, total_value, monthly_value)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, months, total_value, monthly_value
  `

  const result = await pool.query(insertQuery, [
    data.name,
    data.months,
    data.value,
    data.monthlyValue,
  ])

  return mapGoalRow(result.rows[0])
}

export async function listGoals(filter: {
  name?: string
  month?: Month
}): Promise<InvestmentGoal[]> {
  const conditions: string[] = []
  const values: (string | number)[] = []

  if (filter.name) {
    values.push(`%${filter.name}%`)
    conditions.push(`name ILIKE $${values.length}`)
  }

  if (filter.month) {
    values.push(filter.month)
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

  return result.rows.map(mapGoalRow)
}

export async function findGoalById(id: number): Promise<InvestmentGoal | null> {
  const result = await pool.query(
    'SELECT id, name, months, total_value, monthly_value FROM investment_goals WHERE id = $1',
    [id],
  )

  if (!result.rows.length) {
    return null
  }

  return mapGoalRow(result.rows[0])
}

export async function updateGoal(data: {
  id: number
  name: string
  months: Month[]
  value: number
  monthlyValue: number
}): Promise<InvestmentGoal | null> {
  const updateQuery = `
    UPDATE investment_goals
    SET name = $1, months = $2, total_value = $3, monthly_value = $4
    WHERE id = $5
    RETURNING id, name, months, total_value, monthly_value
  `

  const result = await pool.query(updateQuery, [
    data.name,
    data.months,
    data.value,
    data.monthlyValue,
    data.id,
  ])

  if (!result.rows.length) {
    return null
  }

  return mapGoalRow(result.rows[0])
}

export async function patchGoal(data: {
  id: number
  name?: string
  months?: Month[]
  value?: number
}): Promise<InvestmentGoal | null> {
  const current = await pool.query(
    'SELECT * FROM investment_goals WHERE id = $1',
    [data.id],
  )

  if (!current.rows.length) {
    return null
  }

  const updated = {
    name: data.name ?? current.rows[0].name,
    months: data.months ?? current.rows[0].months,
    value: data.value ?? Number(current.rows[0].total_value),
  }

  const monthlyValue = Number(
    (updated.value / updated.months.length).toFixed(2),
  )

  const result = await pool.query(
    `
    UPDATE investment_goals
    SET name = $1,
        months = $2,
        total_value = $3,
        monthly_value = $4
    WHERE id = $5
    RETURNING id, name, months, total_value, monthly_value
  `,
    [updated.name, updated.months, updated.value, monthlyValue, data.id],
  )

  return mapGoalRow(result.rows[0])
}

export async function removeGoal(id: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM investment_goals WHERE id = $1 RETURNING id',
    [id],
  )

  return Boolean(result.rows.length)
}
