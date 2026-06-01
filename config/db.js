const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: parseInt(process.env.MYSQLPORT || "3306")
});

console.log("DB QUERY TYPE =", typeof db.query);

db.connect((err) => {
  if (err) {
    console.error("MYSQL ERROR:", err);
  } else {
    console.log("MYSQL CONNECTED");
  }
});

module.exports = db;