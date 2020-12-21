"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _koa = _interopRequireDefault(require("koa"));

var _ajv = _interopRequireDefault(require("ajv"));

var _router = _interopRequireDefault(require("@koa/router"));

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
    }
  }
});

const Track = require('./models/track');

const Release = require('./models/release');

const Profile = require('./models/profile');

const app = new _koa.default();
const router = new _router.default();
router.get('/tag/:tag', async (ctx, next) => {
  const tag = ctx.params.tag;
  const {
    page = 1
  } = ctx.request.query;
  const limit = 20;
  const offset = page > 1 ? (page - 1) * limit : 0;

  try {
    const result = await new Promise((resolve, reject) => {
      return Release.esSearch({
        from: offset,
        size: limit,
        query: {
          fuzzy: {
            tags: {
              value: tag,
              fuzziness: 'AUTO',
              max_expansions: 10,
              prefix_length: 3,
              boost: 2.0
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
        if (err) return reject(err);
        console.log(results);
        return resolve({
          total: results.hits.total,
          data: results.hits.hits.map(result => {
            return Object.assign({}, result._doc, {
              kind: 'album',
              // ep, lp
              score: result._esResult._score
            });
          })
        });
      });
    });

    if (!result.data.length) {
      ctx.status = 404;
      ctx.throw(ctx.status, 'No results');
    }

    ctx.body = {
      count: result.total,
      numberOfPages: Math.ceil(result.total / limit),
      data: result.data.sort((a, b) => b.score - a.score)
    };
  } catch (err) {
    ctx.throw(ctx.status, err.message);
  }

  await next();
});
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

    const {
      q
    } = ctx.request.query;
    const result = await Promise.all([new Promise((resolve, reject) => {
      return Release.esSearch({
        from: 0,
        size: 10,
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
        if (err) return reject(err);
        const data = results.hits.hits.map(result => {
          return Object.assign({}, result._doc, {
            kind: 'album',
            score: result._esResult._score
          });
        });
        return resolve(data);
      });
    }), new Promise((resolve, reject) => {
      return Track.esSearch({
        from: 0,
        size: 10,
        query: {
          multi_match: {
            query: q,
            fields: ['title'],
            // may add more later
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
        if (err) return reject(err);
        const data = results.hits.hits.map(result => {
          return Object.assign({}, result._doc, {
            kind: 'track',
            score: result._esResult._score
          });
        });
        return resolve(data);
      });
    }), new Promise((resolve, reject) => {
      return Profile.search({
        query_string: {
          query: q,
          default_field: 'name',
          minimum_should_match: 2
        }
      }, {
        hydrate: true,
        hydrateWithESResults: true,
        hydrateOptions: {
          select: 'name kind user_id'
        }
      }, (err, results) => {
        if (err) return reject(err);
        const data = results.hits.hits.map(result => {
          return Object.assign({}, result._doc, {
            score: result._esResult._score
          });
        });
        return resolve(data);
      });
    })]);

    if (!result.flat(1).length) {
      ctx.status = 404;
      ctx.throw(ctx.status, 'No results');
    }

    ctx.body = {
      data: result.flat(1).sort((a, b) => b.score - a.score)
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