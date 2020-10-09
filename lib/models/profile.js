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
ProfileSchema.plugin(_mongooseElasticsearchXp.default, {
  client: _elasticClient.default,
  index: 'profiles',
  type: 'profile'
});

const Profile = _mongoose.db.model('Profile', ProfileSchema, 'Profiles');

Profile.esSynchronize();
var _default = Profile;
exports.default = _default;
module.exports = exports.default;