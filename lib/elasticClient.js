"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elasticsearch = _interopRequireDefault(require("elasticsearch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const client = new _elasticsearch.default.Client({
  host: process.env.ELASTIC_HOST || 'localhost:9200',
  log: process.env.ELASTIC_LOG || 'trace',
  httpAuth: process.env.ELASTIC_USER + ':' + process.env.ELASTIC_PASSWORD,
  apiVersion: process.env.ELASTIC_VERSION || '7.6'
});
var _default = client;
exports.default = _default;
module.exports = exports.default;