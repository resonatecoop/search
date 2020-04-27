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
  name: {
    type: String,
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
ArtistSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'artists',
  type: 'artist'
});

const Artist = _mongoose.db.model('Artist', ArtistSchema, 'Artists');

Artist.esSynchronize();
var _default = Artist;
exports.default = _default;
module.exports = exports.default;