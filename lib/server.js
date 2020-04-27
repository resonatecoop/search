"use strict";

var _ = _interopRequireDefault(require("."));

var _koa = _interopRequireDefault(require("koa"));

var _koaLogger = _interopRequireDefault(require("koa-logger"));

var _ioredis = _interopRequireDefault(require("ioredis"));

var _koaCompress = _interopRequireDefault(require("koa-compress"));

var _koaMount = _interopRequireDefault(require("koa-mount"));

var _koaJsonError = _interopRequireDefault(require("koa-json-error"));

var _koaRatelimit = _interopRequireDefault(require("koa-ratelimit"));

var _koaSession = _interopRequireDefault(require("koa-session"));

var _keygrip = _interopRequireDefault(require("keygrip"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = process.env.PORT || 3000;
const app = new _koa.default();
app.keys = new _keygrip.default([process.env.APP_KEY, process.env.APP_KEY_2], 'sha256');
app.use((0, _koaLogger.default)()).use((0, _koaRatelimit.default)({
  db: new _ioredis.default({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD
  }),
  duration: 60000,
  errorMessage: 'Search API is rate limited',
  id: ctx => ctx.ip,
  headers: {
    remaining: 'Rate-Limit-Remaining',
    reset: 'Rate-Limit-Reset',
    total: 'Rate-Limit-Total'
  },
  max: 100,
  disableHeader: false,
  whitelist: ctx => {// some logic that returns a boolean
  },
  blacklist: ctx => {// some logic that returns a boolean
  }
})).use((0, _koaSession.default)(app)).use((0, _koaCompress.default)({
  filter: contentType => {
    return /text/i.test(contentType);
  },
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
})).use((0, _koaJsonError.default)(err => {
  return {
    status: err.status,
    message: err.message,
    data: null
  };
}));
app.use((0, _koaMount.default)(_.default));
app.listen(PORT, () => {
  console.log(`Resonate Search API is running on port: ${PORT}`);
});