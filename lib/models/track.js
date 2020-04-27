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
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel',
    es_type: {
      name: {
        es_type: 'string'
      }
    }
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Band', 'Artist', 'Label']
  },
  title: {
    type: String,
    es_indexed: true
  },
  display_artist: {
    type: String,
    es_indexed: true
  },
  uri: String,
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

Track.on('es-bulk-sent', function () {
  console.log('buffer sent');
});
Track.on('es-bulk-data', function (doc) {
  console.log('Adding ' + doc.title);
});
Track.on('es-bulk-error', function (err) {
  console.error(err);
});
const query = Track.find().populate('user');
Track.esSynchronize(query, '+resume').then(function () {
  console.log('end.');
});
var _default = Track;
exports.default = _default;
module.exports = exports.default;