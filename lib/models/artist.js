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
const ArtistSchema = new Schema({
  id: Number,
  labels: [{
    _label: {
      type: Schema.Types.ObjectId,
      ref: 'Label'
    }
  }],
  bands: [{
    _label: {
      type: Schema.Types.ObjectId,
      ref: 'Band'
    }
  }],
  name: {
    type: String,
    es_indexed: true
  },
  uri: String
}, {
  strict: true,
  minimize: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});
ArtistSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'artists',
  type: 'artist'
});

const Artist = _mongoose.db.model('Artist', ArtistSchema, 'Artists');

Artist.on('es-bulk-sent', function () {
  console.log('buffer sent');
});
Artist.on('es-bulk-data', function (doc) {
  console.log('Adding ' + doc.name);
});
Artist.on('es-bulk-error', function (err) {
  console.error(err);
});
Artist.esSynchronize().then(function () {
  console.log('end.');
});
var _default = Artist;
exports.default = _default;
module.exports = exports.default;