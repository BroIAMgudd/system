const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  //ROOT: Ijj7&b5FcF=2
  host: "localhost",
  user: "HaxerAdmin",
  password: "9rR3h*b5V2QQ",
  database: "haxdb",
  connectionLimit: 10
});

module.exports = pool;
