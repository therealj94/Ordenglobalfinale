require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'veta_wallet_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    username: 'postgres',
    password: 'test',
    database: 'veta_wallet_test',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: process.env.DB_SSL === 'false' ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
