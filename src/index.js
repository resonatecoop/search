import Koa from 'koa'
import AJV from 'ajv'
import Router from '@koa/router'
// import hash from 'promise-hash/lib/promise-hash'

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
      type: 'string'
    }
  }
})

const Track = require('./models/track')
const Release = require('./models/release')
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

    const result = await Promise.all([
      new Promise((resolve, reject) => {
        return Release.esSearch({
          from: 0,
          size: 50,
          query: {
            multi_match: {
              query: q,
              fields: ['display_artist', 'title', 'tags'],
              operator: 'or'
            }
          }
        }, {
          hydrate: true,
          hydrateWithESResults: true,
          hydrateOptions: {
            select: 'title display_artist tags track_group_id'
          }
        }, (err, results) => {
          if (err) return reject(err)
          const data = results.hits.hits.map(result => {
            return Object.assign({}, result._doc, {
              kind: 'release',
              score: result._esResult._score
            })
          })
          return resolve(data)
        })
      }),
      new Promise((resolve, reject) => {
        return Track.esSearch({
          from: 0,
          size: 50,
          query: {
            multi_match: {
              query: q,
              fields: ['display_artist', 'title', 'tags'],
              operator: 'or'
            }
          }
        }, {
          hydrate: true,
          hydrateWithESResults: true,
          hydrateOptions: {
            select: 'title display_artist tags track_id'
          }
        }, (err, results) => {
          if (err) return reject(err)
          const data = results.hits.hits.map(result => {
            return Object.assign({}, result._doc, {
              kind: 'track',
              score: result._esResult._score
            })
          })
          return resolve(data)
        })
      }),
      new Promise((resolve, reject) => {
        return Profile.search({
          query_string: {
            query: q,
            fuzziness: 'AUTO'
          }
        }, {
          hydrate: true,
          hydrateWithESResults: true,
          hydrateOptions: {
            select: 'name kind user_id'
          }
        }, (err, results) => {
          if (err) return reject(err)
          const data = results.hits.hits.map(result => {
            return Object.assign({}, result._doc, {
              score: result._esResult._score
            })
          })
          return resolve(data)
        })
      })
    ])

    ctx.body = {
      data: result.flat(1).sort((a, b) => b.score - a.score)
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
