import search from '.'
import Koa from 'koa'
import logger from 'koa-logger'
import Redis from 'ioredis'
import compress from 'koa-compress'
import mount from 'koa-mount'
import error from 'koa-json-error'
import ratelimit from 'koa-ratelimit'
import session from 'koa-session'
import KeyGrip from 'keygrip'

const PORT = process.env.PORT || 3000

const app = new Koa()

app.keys = new KeyGrip([process.env.APP_KEY, process.env.APP_KEY_2], 'sha256')

app
  .use(logger())
  .use(ratelimit({
    db: new Redis({
      port: process.env.REDIS_PORT || 6379,
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD
    }),
    duration: 60000,
    errorMessage: 'Search API is rate limited',
    id: (ctx) => ctx.ip,
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    },
    max: 100,
    disableHeader: false
  }))
  .use(session(app))
  .use(compress({
    filter: (contentType) => {
      return /text/i.test(contentType)
    },
    threshold: 2048,
    flush: require('zlib').Z_SYNC_FLUSH
  }))
  .use(error(err => {
    return {
      status: err.status,
      message: err.message,
      data: null
    }
  }))

app.use(mount(search))

app.listen(PORT, () => {
  console.log(`Resonate Search API is running on port: ${PORT}`)
})
