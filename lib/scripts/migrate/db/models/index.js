"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const basename = _path.default.basename(__filename);

const env = process.env.NODE_ENV || 'development';

const config = require(_path.default.join(__dirname, '/../../config/databases'))[env];

const db = {};
const databases = Object.keys(config.databases);

for (let i = 0; i < databases.length; ++i) {
  const database = databases[i];
  const dbPath = config.databases[database];
  db[database] = new _sequelize.default(dbPath.database, dbPath.username, dbPath.password, dbPath);
}

_fs.default.readdirSync(_path.default.join(__dirname, './resonate')).filter(file => {
  return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
}).forEach(file => {
  const model = db.Resonate.import(_path.default.join(__dirname, '/resonate', file));
  db[model.name] = model;
});

db.Sequelize = _sequelize.default;
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
var _default = db;
exports.default = _default;
module.exports = exports.default;