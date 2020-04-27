"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koa = _interopRequireDefault(require("koa"));

var _ajv = _interopRequireDefault(require("ajv"));

var _router = _interopRequireDefault(require("@koa/router"));

var _promiseHash = _interopRequireDefault(require("promise-hash/lib/promise-hash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const validateQuery = new _ajv.default({
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
});

const Track = require('./models/track');

const Artist = require('./models/artist');

const Band = require('./models/band');

const Label = require('./models/label');

const app = new _koa.default();
const router = new _router.default();
router.get('/', async (ctx, next) => {
  try {
    const isValid = validateQuery(ctx.request.query);

    if (!isValid) {
      const {
        message,
        dataPath
      } = validateQuery.errors[0];
      ctx.status = 400;
      ctx.throw(400, `${dataPath}: ${message}`);
    }

    const q = ctx.request.query.q;
    const result = await (0, _promiseHash.default)({
      tracks: Track.esSearch({
        multi_match: {
          fields: ['display_artist', 'title', 'tags'],
          query: q
        }
      }, {
        hydrate: {
          select: 'title display_artist tags',
          populate: {
            path: 'user',
            // TODO make it work with dynamic ref
            select: 'name'
          },
          docsOnly: true
        }
      }),
      labels: Label.esSearch({
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
          select: 'name',
          docsOnly: true
        }
      }),
      bands: Band.esSearch({
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
          select: 'name',
          docsOnly: true
        }
      }),
      artists: Artist.esSearch({
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
          select: 'name',
          docsOnly: true
        }
      })
    });
    ctx.body = {
      data: result
    };
  } catch (err) {
    ctx.throw(ctx.status, err.message);
  }

  await next();
});
app.use(router.routes()).use(router.allowedMethods({
  throw: true
}));
var _default = app;
exports.default = _default;
module.exports = exports.default;