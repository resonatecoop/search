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
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
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
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
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
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
          timestamps: false
        }
      }
    }
  }
}

export default config
