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
const ProfileSchema = new Schema({
  user_id: Number,
  // user ID from wordpress
  kind: {
    type: String,
    enum: ['label', 'artist', 'band'],
    default: 'artist'
  },
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
ProfileSchema.plugin(_mongoosastic.default, {
  esClient: _elasticClient.default
});

const Profile = _mongoose.db.model('Profile', ProfileSchema, 'Profiles');

const stream = Profile.synchronize();
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
var _default = Profile;
exports.default = _default;
module.exports = exports.default;