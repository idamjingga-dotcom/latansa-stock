const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT)
});

db.connect((err) => {
  if (err) {
    console.error("Database gagal terhubung");
    console.error(err);
  } else {
    console.log("Database LATANSA berhasil terhubung");
  }
});

module.exports = db;