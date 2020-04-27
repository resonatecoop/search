"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = require("../mongoose");

var _mongooseElasticsearchXp = _interopRequireDefault(require("mongoose-elasticsearch-xp"));

var _elasticClient = _interopRequireDefault(require("../elasticClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Schema = _mongoose.mongoose.Schema;
const TrackSchema = new Schema({
  id: Number,
  user: Number,
  title: {
    type: String,
    es_indexed: true
  },
  display_artist: {
    type: String,
    es_indexed: true
  },
  tags: {
    type: [],
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
TrackSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'tracks',
  type: 'track'
});

const Track = _mongoose.db.model('Track', TrackSchema, 'Tracks');

const query = Track.find().populate('user');
Track.esSynchronize(query, '+resume');
var _default = Track;
exports.default = _default;
module.exports = exports.default;