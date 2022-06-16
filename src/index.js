import Koa from 'koa'
import AJV from 'ajv'
import Router from '@koa/router'
import { map } from 'awaity/esm'

const ajvConfig = {
  coerceTypes: true,
  allErrors: true,
  removeAdditional: true
}

const validateSearch = new AJV(ajvConfig).compile({
  type: 'object',
  additionalProperties: false,
  required: ['q'],
  properties: {
    q: {
      type: 'string',
      minLength: 3
    },
    from: {
      type: 'number',
      min: 0,
      max: 100
    },
    limit: {
      type: 'number',
      min: 1,
      max: 100
    }
  }
})

const validateList = new AJV(ajvConfig).compile({
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: {
      type: 'number',
      min: 1
    },
    page: {
      type: 'number',
      min: 1
    }
  }
})

const Track = require('./models/track')
const Release = require('./models/release')
const Profile = require('./models/profile')

const app = new Koa()

const router = new Router()

router.get('/tag/:tag', async (ctx, next) => {
  const tag = ctx.params.tag
  const { page = 1 } = ctx.request.query
  const limit = 20
  const offset = page > 1 ? (page - 1) * limit : 0

  try {
    const result = await new Promise((resolve, reject) => {
      return Release.esSearch({
        from: offset,
        size: limit,
        query: {
          function_score: {
            score_mode: 'first',
            functions: [
              {
                filter: {
                  exists: {
                    field: 'release_date'
                  }
                },
                gauss: {
                  release_date: {
                    origin: new Date().toISOString(),
                    scale: '365d',
                    decay: 0.5
                  }
                }
              },
              {
                script_score: {
                  script: '0'
                }
              }
            ],
            query: {
              fuzzy: {
                tags: {
                  value: tag,
                  fuzziness: 'AUTO',
                  max_expansions: 10,
                  prefix_length: 3
                }
              }
            }
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

        return resolve({
          total: results.hits.total,
          data: results.hits.hits.map(result => {
            return Object.assign({}, result._doc, {
              kind: 'album', // ep, lp
              score: result._esResult._score
            })
          })
        })
      })
    })

    if (!result.data.length) {
      ctx.status = 404
      ctx.throw(ctx.status, 'No results')
    }

    ctx.body = {
      count: result.total,
      numberOfPages: Math.ceil(result.total / limit),
      data: result.data.sort((a, b) => b.score - a.score)
    }
  } catch (err) {
    ctx.throw(ctx.status, err.message)
  }
  await next()
})

router.get('/', async (ctx, next) => {
  try {
    const isValid = validateSearch(ctx.request.query)

    if (!isValid) {
      const { message, dataPath } = validateSearch.errors[0]
      ctx.status = 400
      ctx.throw(400, `${dataPath}: ${message}`)
    }

    const { q, limit = 20 } = ctx.request.query

    const result = await Promise.all([
      new Promise((resolve, reject) => {
        return Release.esSearch({
          from: 0,
          size: limit,
          query: {
            multi_match: {
              query: q,
              fields: ['display_artist', 'title', 'tags', 'composers', 'performers'],
              operator: 'or',
              minimum_should_match: 2
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
              kind: 'album',
              score: result._esResult._score
            })
          })
          return resolve(data)
        })
      }),
      new Promise((resolve, reject) => {
        return Track.esSearch({
          from: 0,
          size: limit,
          query: {
            multi_match: {
              query: q,
              fields: ['title'], // may add more later
              operator: 'or',
              minimum_should_match: 2
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
        return Profile.esSearch({
          from: 0,
          size: limit,
          query: {
            function_score: {
              boost_mode: 'multiply',
              boost: 1,
              score_mode: 'first',
              functions: [
                {
                  filter: {
                    range: { last_activity: { gte: 'now-1y', lte: 'now' } }
                  },
                  weight: 2
                },
                {
                  filter: {
                    exists: {
                      field: 'last_activity'
                    }
                  },
                  weight: 1.5
                }
              ],
              query: {
                query_string: {
                  query: q,
                  minimum_should_match: 2,
                  fields: ['name', 'twitter_handle']
                }
              }
            }
          }
        }, {
          hydrate: true,
          hydrateWithESResults: true,
          hydrateOptions: {
            select: 'name twitter_handle kind user_id'
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

    if (!result.flat(1).length) {
      ctx.status = 404
      ctx.throw(ctx.status, 'No results')
    }

    ctx.body = {
      data: result.flat(1).sort((a, b) => b.score - a.score)
    }
  } catch (err) {
    ctx.throw(ctx.status, err.message)
  }
  await next()
})

router.get('/artists', async (ctx, next) => {
  if (await ctx.cashed()) return

  const isValid = validateList(ctx.request.query)

  if (!isValid) {
    const { message, dataPath } = validateSearch.errors[0]
    ctx.status = 400
    ctx.throw(400, `${dataPath}: ${message}`)
  }

  const { page = 1, limit = 20 } = ctx.request.query

  try {
    const result = await Profile.find({
      kind: ['band', 'artist']
    })
      .sort({
        last_activity: -1
      })
      .select('-_id user_id name twitter_handle label bio city country')
      .skip(limit * page)
      .limit(limit)

    ctx.body = {
      data: await map(result, async (item) => {
        const response = await fetch(`https://resonate.is/api/fetch-profile-image/${item.user_id}`)
        const result = await response.json()
        return {
          name: item.name,
          twitter_handle: item.twitter_handle,
          label: item.label,
          bio: item.bio,
          city: item.city,
          country: item.country,
          images: result
        }
      })
    }
  } catch (err) {
    ctx.throw(ctx.status, err.message)
  }
  await next()
})

router.get('/labels', async (ctx, next) => {
  if (await ctx.cashed()) return

  const isValid = validateList(ctx.request.query)

  if (!isValid) {
    const { message, dataPath } = validateSearch.errors[0]
    ctx.status = 400
    ctx.throw(400, `${dataPath}: ${message}`)
  }

  const { page = 1, limit = 20 } = ctx.request.query

  try {
    const result = await Profile.find({
      kind: 'label'
    })
      .sort({
        user_id: -1 // TODO set last_activity timestamp on labels with artists or tracks
      })
      .select('-_id name twitter_handle bio city country user_id')
      .skip(limit * page)
      .limit(limit)

    ctx.body = {
      data: await map(result, async (item) => {
        const response = await fetch(`https://resonate.is/api/fetch-profile-image/${item.user_id}`)
        const result = await response.json()
        return {
          name: item.name,
          twitter_handle: item.twitter_handle,
          label: item.label,
          bio: item.bio,
          city: item.city,
          country: item.country,
          images: result
        }
      })
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
