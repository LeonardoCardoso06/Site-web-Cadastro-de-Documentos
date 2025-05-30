const { Pool } = require("pg");
require("dotenv").config({ path: __dirname + "/.env" });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

module.exports = pool;
