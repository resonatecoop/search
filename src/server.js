import Koa from 'koa'
import logger from 'koa-logger'
import Redis from 'ioredis'
import compress from 'koa-compress'
import mount from 'koa-mount'
import error from 'koa-json-error'
import ratelimit from 'koa-ratelimit'
import etag from 'koa-etag'
import session from 'koa-session'
import KeyGrip from 'keygrip'
import LRU from 'lru-cache'
import koaCash from 'koa-cash'
import ms from 'ms'

const CACHE_MAX_AGE = process.env.NODE_ENV === 'production' ? ms('3h') : ms('1m')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config() // babel-watch support
}

const PORT = process.env.PORT || 3000

const app = new Koa()

const cache = new LRU({
  maxAge: CACHE_MAX_AGE // global max age
})

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
  .use(koaCash({
    maxAge: CACHE_MAX_AGE,
    threshold: 0,
    compression: true, // https://github.com/koajs/cash#compression
    setCachedHeader: true, // https://github.com/koajs/cash#setcachedheader
    get (key) {
      console.log(key)
      return cache.get(key)
    },
    set (key, value) {
      return cache.set(key, value)
    }
  }))
  .use(etag()) // required for koa-cash to propertly set 304
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

app.use(mount(require('./index.js')))

app.listen(PORT, () => {
  console.log(`Resonate Search API is running on port: ${PORT}`)
})
