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
const LabelSchema = new Schema({
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
LabelSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'labels',
  type: 'label'
});

const Label = _mongoose.db.model('Label', LabelSchema, 'Labels');

Label.esSynchronize();
var _default = Label;
exports.default = _default;
module.exports = exports.default;