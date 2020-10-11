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
const TrackSchema = new Schema({
  track_id: {
    type: Number,
    es_indexed: true
  },
  title: {
    type: String,
    es_indexed: true
  },
  display_artist: {
    es_boost: 2.0,
    type: String,
    es_indexed: true
  },
  album: {
    type: String,
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
TrackSchema.plugin(_mongoosastic.default, {
  esClient: _elasticClient.default
});

const Track = _mongoose.db.model('Track', TrackSchema, 'Tracks');

const stream = Track.synchronize();
let count = 0;
stream.on('data', function (err, doc) {
  if (err) throw err;
  count++;
});
stream.on('close', function () {
  console.log('indexed ' + count + ' documents!');
});
stream.on('error', function (err) {
  console.log(err);
});
var _default = Track;
exports.default = _default;
module.exports = exports.default;