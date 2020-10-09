import Koa from 'koa'
import AJV from 'ajv'
import Router from '@koa/router'
import hash from 'promise-hash/lib/promise-hash'

const validateQuery = new AJV({
  coerceTypes: true,
  allErrors: true,
  removeAdditional: true
}).compile({
  type: 'object',
  additionalProperties: false,
  required: ['q'],
  properties: {
    q: {
      type: 'string',
      minLength: 3
    },
    limit: {
      type: 'number',
      maximum: 100,
      minimum: 1
    }
  }
})

const Track = require('./models/track')
const Profile = require('./models/profile')

const app = new Koa()

const router = new Router()

router.get('/', async (ctx, next) => {
  try {
    const isValid = validateQuery(ctx.request.query)

    if (!isValid) {
      const { message, dataPath } = validateQuery.errors[0]
      ctx.status = 400
      ctx.throw(400, `${dataPath}: ${message}`)
    }

    const q = ctx.request.query.q

    const result = await hash({
      tracks: Track.esSearch({
        multi_match: {
          fields: ['display_artist', 'title', 'tags'],
          query: q
        }
      }, {
        hydrate: {
          select: 'title display_artist tags track_id',
          docsOnly: true
        }
      }),
      profiles: Profile.esSearch({
        multi_match: {
          fields: ['name'],
          query: q,
          max_expansions: 1,
          prefix_length: 1,
          fuzziness: 'AUTO',
          minimum_should_match: '3<90%'
        }
      }, {
        hydrate: {
          select: 'name kind user_id',
          docsOnly: true
        }
      })
    })

    console.log(result)

    ctx.body = {
      data: result
    }
  } catch (err) {
    ctx.throw(ctx.status, err.message)
  }
  await next()
})

app
  .use(router.routes())
  .use(router.allowedMethods({
    throw: true
  }))

export default app
