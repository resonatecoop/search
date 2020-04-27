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
const BandSchema = new Schema({
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
BandSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'bands',
  type: 'band'
});

const Band = _mongoose.db.model('Band', BandSchema, 'Bands');

Band.esSynchronize();
var _default = Band;
exports.default = _default;
module.exports = exports.default;