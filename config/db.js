throw new Error("CONFIG DB TEST");
const mysql = require("mysql2");

console.log("MYSQLHOST:", process.env.MYSQLHOST);
console.log("MYSQLPORT:", process.env.MYSQLPORT);
console.log("MYSQLUSER:", process.env.MYSQLUSER);
console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE);

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT)
});
console.log("DB OBJECT =", db);
console.log("DB QUERY TYPE =", typeof db.query);

module.exports = db;
console.log("DB QUERY TYPE =", typeof db.query);
console.log("MYSQL VERSION =", require("mysql2/package.json").version);