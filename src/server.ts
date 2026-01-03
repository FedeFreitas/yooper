import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { investmentGoalsRoutes } from './routes/investmentGoals.routes'

const app = fastify().withTypeProvider<ZodTypeProvider>()



app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, { origin: '*' })


app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Investment Goals API',
            version: '1.0.0',
            description:
                "API RESTful para criar, listar, atualizar e excluir metas de investimento.",
        }
    },
    transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
    routePrefix: '/docs'
})

app.register(investmentGoalsRoutes, { prefix: "/investment-goals" })


app.get('/', async (_, reply) => {
  return reply.status(200).send({
    status: 'healthy',
    service: 'investment-goals-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

async function startServer() {
    await app.listen({ port, host })
    console.log(`Server rodando na porta: ${port}!`)
}

startServer().catch((err) => {
    app.log.error(err)
    process.exit(1)
})
