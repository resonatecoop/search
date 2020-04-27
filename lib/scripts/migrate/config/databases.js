"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const config = {
  development: {
    databases: {
      Resonate: {
        username: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        database: process.env.MYSQL_DB_NAME,
        host: process.env.MYSQL_DB_HOST,
        dialect: 'mysql',
        logging: console.log,
        pool: {
          max: 100,
          min: 0,
          idle: 200000,
          acquire: 1000000
        },
        define: {
          charset: 'utf8',
          collate: 'utf8_general_ci',
          timestamps: false
        }
      }
    }
  },
  test: {
    databases: {
      Resonate: {
        username: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        database: process.env.MYSQL_DB_NAME,
        host: process.env.MYSQL_DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: {
          charset: 'utf8',
          collate: 'utf8_general_ci',
          timestamps: false
        }
      }
    }
  },
  production: {
    databases: {
      Resonate: {
        username: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        database: process.env.MYSQL_DB_NAME,
        host: process.env.MYSQL_DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: {
          charset: 'utf8',
          collate: 'utf8_general_ci',
          timestamps: false
        }
      }
    }
  }
};
var _default = config;
exports.default = _default;
module.exports = exports.default;