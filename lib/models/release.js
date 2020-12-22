"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = require("../mongoose");

var _elasticClient = _interopRequireDefault(require("../elasticClient"));

var _mongoosastic = _interopRequireDefault(require("mongoosastic"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Schema = _mongoose.mongoose.Schema;
const ReleaseSchema = new Schema({
  track_group_id: {
    type: String // release uuid

  },
  title: {
    type: String,
    es_indexed: true
  },
  creator_id: {
    type: Number
  },
  display_artist: {
    es_boost: 2.0,
    type: String,
    es_indexed: true
  },
  release_date: {
    type: Date,
    // new releases with minimum match should be boosted
    es_indexed: true
  },
  about: {
    type: String,
    es_indexed: true
  },
  composers: {
    type: [String],
    es_indexed: true
  },
  performers: {
    type: [String],
    es_indexed: true
  },
  tags: {
    type: [String],
    es_indexed: true
  }
}, {
  strict: true,
  minimize: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});
ReleaseSchema.plugin(_mongoosastic.default, {
  esClient: _elasticClient.default
});

const Release = _mongoose.db.model('Release', ReleaseSchema, 'Releases');

var _default = Release;
exports.default = _default;
module.exports = exports.default;