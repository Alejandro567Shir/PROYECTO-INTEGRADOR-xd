const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sgt_espoch",
  password: "123456",
  port: 5432,
});

module.exports = pool;