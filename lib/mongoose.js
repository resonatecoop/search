"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mongodbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/resonate';
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
_mongoose.default.Promise = global.Promise;

_mongoose.default.connect(mongodbUri, options);

const db = _mongoose.default.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));
db.once('open', () => console.log('Moogose connected.'));
var _default = {
  db,
  mongoose: _mongoose.default
};
exports.default = _default;
module.exports = exports.default;