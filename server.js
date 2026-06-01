require("dotenv").config();
const fs = require("fs");

console.log("ENV FILE EXISTS =", fs.existsSync(".env"));
console.log("CURRENT DIR =", process.cwd());
const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./config/db");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));
const ExcelJS = require("exceljs");
app.get("/export/produk", async (req, res) => {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Produk");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Nama Produk", key: "nama_produk", width: 30 },
    { header: "Harga", key: "harga", width: 20 },
    { header: "Stock", key: "stock", width: 15 }
  ];

  db.query(
    "SELECT * FROM products",
    async (err, rows) => {

      if (err) return res.send(err);

      rows.forEach((item) => {
        sheet.addRow(item);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=produk.xlsx"
      );

      await workbook.xlsx.write(res);

      res.end();

    }
  );

});

// HALAMAN LOGIN
app.get("/", (req, res) => {
  res.render("login");
});

// PROSES LOGIN SEMENTARA
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "latansa123") {
    req.session.user = {
      username: "admin",
      role: "admin",
    };

    return res.redirect("/dashboard");
  }

  if (username === "gudang" && password === "gudang123") {
    req.session.user = {
      username: "gudang",
      role: "gudang",
    };

    return res.redirect("/dashboard");
  }

  res.send("Username atau Password Salah");
});


  // DASHBOARD
app.get("/dashboard", (req, res) => {

  if (!req.session.user) {
    return res.redirect("/");
  }

  db.query(
    "SELECT COUNT(*) totalProduk FROM products",
    (err, produk) => {

      if (err) return res.send(err);

      db.query(
        "SELECT SUM(stock) totalStock FROM products",
        (err, stock) => {

          if (err) return res.send(err);

          db.query(
            "SELECT COUNT(*) totalCustomer FROM customers",
            (err, customer) => {

              if (err) return res.send(err);

              db.query(
                "SELECT SUM(total) omzet FROM transactions",
                (err, omzet) => {

                  if (err) return res.send(err);

                  db.query(
                    "SELECT SUM(sisa) piutang FROM transactions WHERE status='BELUM LUNAS'",
                    (err, piutang) => {
                      if (err) return res.send(err);                 
                      res.render("dashboard", {
                        totalProduk: produk[0].totalProduk || 0,
                        totalStock: stock[0].totalStock || 0,
                        totalCustomer: customer[0].totalCustomer || 0,
                        omzet: omzet[0].omzet || 0,
                        piutang: piutang[0].piutang || 0
                      });

                    }
                  );

                }
              );

            }
          );

        }
      );

    }
  );
});
// HALAMAN PRODUK
app.get("/produk", (req, res) => {

  if (!req.session.user) {
    return res.redirect("/");
  }

  db.query(
    "SELECT * FROM products ORDER BY id DESC",
    (err, rows) => {

      if (err) {
        return res.send(err);
      }

      res.render("produk", {
        products: rows
      });

    }
  );

});
// SIMPAN PRODUK
app.post("/produk/tambah", (req, res) => {

  const { nama_produk, harga, stock } = req.body;

  db.query(
    "INSERT INTO products(nama_produk,harga,stock) VALUES(?,?,?)",
    [nama_produk, harga, stock],
    (err) => {

      if (err) {
        return res.send(err);
      }

      res.redirect("/produk");

    }
  );

});

// HAPUS PRODUK
app.get("/produk/hapus/:id", (req, res) => {

  db.query(
    "DELETE FROM products WHERE id=?",
    [req.params.id],
    (err) => {

      if (err) {
        return res.send(err);
      }

      res.redirect("/produk");

    }
  );

});

// EDIT PRODUK
app.get("/produk/edit/:id", (req, res) => {

  db.query(
    "SELECT * FROM products WHERE id=?",
    [req.params.id],
    (err, rows) => {

      if (err) {
        return res.send(err);
      }

      res.render("edit-produk", {
        produk: rows[0]
      });

    }
  );

});

// UPDATE PRODUK
app.post("/produk/update/:id", (req, res) => {

  const { nama_produk, harga } = req.body;

  db.query(
    "UPDATE products SET nama_produk=?, harga=? WHERE id=?",
    [nama_produk, harga, req.params.id],
    (err) => {

      if (err) {
        return res.send(err);
      }

      res.redirect("/produk");

    }
  );

});
// FORM TAMBAH STOCK
app.get("/stock/tambah/:id", (req, res) => {

  db.query(
    "SELECT * FROM products WHERE id=?",
    [req.params.id],
    (err, rows) => {

      if (err) return res.send(err);

      res.render("tambah-stock", {
        produk: rows[0]
      });

    }
  );

});

// PROSES TAMBAH STOCK
app.post("/stock/tambah/:id", (req, res) => {

  const qty = parseInt(req.body.qty);

  db.query(
    "UPDATE products SET stock = stock + ? WHERE id=?",
    [qty, req.params.id],
    (err) => {

      if (err) return res.send(err);

     db.query(
  "INSERT INTO stock_history(product_id,tipe,qty) VALUES(?,?,?)",
  [req.params.id, "masuk", qty],
  (err) => {
    if (err) {
      console.log(err);
    }
  }
);
      res.redirect("/produk");

    }
  );

});
// FORM KURANG STOCK
app.get("/stock/kurang/:id", (req, res) => {

  db.query(
    "SELECT * FROM products WHERE id=?",
    [req.params.id],
    (err, rows) => {

      if (err) return res.send(err);

      res.render("kurang-stock", {
        produk: rows[0]
      });

    }
  );

});

// PROSES KURANG STOCK
app.post("/stock/kurang/:id", (req, res) => {

  const qty = parseInt(req.body.qty);

  db.query(
    "UPDATE products SET stock = stock - ? WHERE id=?",
    [qty, req.params.id],
    (err) => {

      if (err) return res.send(err);

     db.query(
  "INSERT INTO stock_history(product_id,tipe,qty) VALUES(?,?,?)",
  [req.params.id, "keluar", qty],
  (err) => {
    if (err) {
      console.log(err);
    }
  }
);
      res.redirect("/produk");

    }
  );

});
// HALAMAN KONSUMEN
app.get("/konsumen", (req, res) => {

  db.query(
    "SELECT * FROM customers ORDER BY id DESC",
    (err, rows) => {

      if (err) return res.send(err);

      res.render("konsumen", {
        customers: rows
      });

    }
  );

});

// SIMPAN KONSUMEN
app.post("/konsumen/tambah", (req, res) => {

  const {
    nama,
    alamat,
    telepon
  } = req.body;

  db.query(
    "INSERT INTO customers(nama,alamat,telepon) VALUES(?,?,?)",
    [nama, alamat, telepon],
    (err) => {

      if (err) return res.send(err);

      res.redirect("/konsumen");

    }
  );

});
app.get("/transaksi", (req, res) => {

  db.query(
    "SELECT * FROM customers",
    (err, customers) => {

      if (err) return res.send(err);

      db.query(
        "SELECT * FROM products",
        (err, products) => {

          if (err) return res.send(err);

          db.query(
            `SELECT
              t.*,
              c.nama
            FROM transactions t
            LEFT JOIN customers c
            ON c.id = t.customer_id
            ORDER BY t.id DESC`,
            (err, transaksi) => {

              if (err) return res.send(err);

              res.render("transaksi", {
                customers,
                products,
                transaksi
              });

            }
          );

        }
      );

    }
  );

});
// SIMPAN TRANSAKSI
app.post("/transaksi/simpan", (req, res) => {

  console.log("ROUTE TRANSAKSI TERPANGGIL");

  const {
    customer_id,
    product_id,
    qty,
    harga,
    bayar
  } = req.body;
  app.post("/transaksi/simpan", (req, res) => {

  console.log("ROUTE TRANSAKSI TERPANGGIL");
  console.log(req.body);

  res.send("POST BERHASIL MASUK");

});
  const total = Number(qty) * Number(harga);
  const sisa = total - Number(bayar);

  const status =
    sisa <= 0
      ? "LUNAS"
      : "BELUM LUNAS";

  db.query(
    "INSERT INTO transactions(customer_id,total,bayar,sisa,status) VALUES(?,?,?,?,?)",
    [
      customer_id,
      total,
      bayar,
      sisa,
      status
    ],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.send(err);
      }

      const transaksiId = result.insertId;

      db.query(
        "INSERT INTO transaction_items(transaction_id,product_id,qty,harga,subtotal) VALUES(?,?,?,?,?)",
        [
          transaksiId,
          product_id,
          qty,
          harga,
          total
        ],
        (err) => {

          if (err) {
            console.log(err);
            return res.send(err);
          }

          db.query(
            "UPDATE products SET stock = stock - ? WHERE id=?",
            [qty, product_id]
          );

          db.query(
            "INSERT INTO stock_history(product_id,tipe,qty) VALUES(?,?,?)",
            [product_id, "keluar", qty]
          );

          res.redirect("/transaksi");

        }
      );

    }
  );

});
// HALAMAN PIUTANG
app.get("/piutang", (req, res) => {

  db.query(
    `SELECT
      t.*,
      c.nama
    FROM transactions t
    LEFT JOIN customers c
    ON c.id = t.customer_id
    ORDER BY t.id DESC`,
    (err, rows) => {

      if (err) return res.send(err);

      res.render("piutang", {
        data: rows
      });

    }
  );

});
app.get("/piutang/bayar/:id", (req, res) => {

  db.query(
    "SELECT * FROM transactions WHERE id=?",
    [req.params.id],
    (err, rows) => {

      if (err) return res.send(err);

      res.render("bayar-piutang", {
        trx: rows[0]
      });

    }
  );

});
app.post("/piutang/bayar/:id", (req, res) => {

  const nominal = Number(req.body.nominal);

  db.query(
    "SELECT * FROM transactions WHERE id=?",
    [req.params.id],
    (err, rows) => {

      if (err) return res.send(err);

      const trx = rows[0];

      const bayarBaru =
        Number(trx.bayar) + nominal;

      const sisaBaru =
        Number(trx.total) - bayarBaru;

      const statusBaru =
        sisaBaru <= 0
          ? "LUNAS"
          : "BELUM LUNAS";

      db.query(
        "UPDATE transactions SET bayar=?, sisa=?, status=? WHERE id=?",
        [
          bayarBaru,
          sisaBaru,
          statusBaru,
          trx.id
        ],
        (err) => {

          if (err) return res.send(err);

          res.redirect("/piutang");

        }
      );

    }
  );

});
app.get("/laporan", (req, res) => {

  res.render("laporan");

});
app.get("/export/transaksi", async (req, res) => {

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transaksi");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Konsumen", key: "nama", width: 30 },
    { header: "Total", key: "total", width: 20 },
    { header: "Bayar", key: "bayar", width: 20 },
    { header: "Sisa", key: "sisa", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Tanggal", key: "created_at", width: 25 }
  ];

  db.query(
    `
    SELECT
      t.*,
      c.nama
    FROM transactions t
    LEFT JOIN customers c
    ON c.id = t.customer_id
    ORDER BY t.id DESC
    `,
    async (err, rows) => {

      if (err) return res.send(err);

      rows.forEach((item) => {
        sheet.addRow(item);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=transaksi.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();

    }
  );

});
app.get("/export/piutang", async (req, res) => {

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Piutang");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Konsumen", key: "nama", width: 30 },
    { header: "Total", key: "total", width: 20 },
    { header: "Bayar", key: "bayar", width: 20 },
    { header: "Sisa", key: "sisa", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Tanggal", key: "created_at", width: 25 }
  ];

  db.query(
    `
    SELECT
      t.*,
      c.nama
    FROM transactions t
    LEFT JOIN customers c
    ON c.id = t.customer_id
    WHERE t.status='BELUM LUNAS'
    ORDER BY t.id DESC
    `,
    async (err, rows) => {

      if (err) return res.send(err);

      rows.forEach((item) => {
        sheet.addRow(item);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=piutang.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();

    }
  );

});
// EXPORT TRANSAKSI EXCEL
app.get("/export/transaksi", async (req, res) => {

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transaksi");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Konsumen", key: "nama", width: 30 },
    { header: "Total", key: "total", width: 20 },
    { header: "Bayar", key: "bayar", width: 20 },
    { header: "Sisa", key: "sisa", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Tanggal", key: "created_at", width: 25 }
  ];

  db.query(
    `
    SELECT
      t.id,
      c.nama,
      t.total,
      t.bayar,
      t.sisa,
      t.status,
      t.created_at
    FROM transactions t
    LEFT JOIN customers c
      ON c.id = t.customer_id
    ORDER BY t.id DESC
    `,
    async (err, rows) => {

      if (err) {
        return res.send(err);
      }

      rows.forEach((row) => {
        sheet.addRow(row);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=transaksi.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();

    }
  );

});
// CETAK INVOICE
app.get("/invoice/:id", (req, res) => {

  db.query(
    `
    SELECT
      t.*,
      c.nama
    FROM transactions t
    LEFT JOIN customers c
    ON c.id = t.customer_id
    WHERE t.id=?
    `,
    [req.params.id],
    (err, trxRows) => {

      if (err) return res.send(err);

      if (trxRows.length === 0) {
        return res.send("Invoice tidak ditemukan");
      }

      const trx = trxRows[0];

      db.query(
        `
        SELECT
          ti.*,
          p.nama_produk
        FROM transaction_items ti
        LEFT JOIN products p
        ON p.id = ti.product_id
        WHERE ti.transaction_id=?
        `,
        [req.params.id],
        (err, items) => {

          if (err) return res.send(err);

          res.render("invoice", {
            trx,
            items
          });

        }
      );

    }
  );

});
// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});
console.log("REGISTER ROUTE TRANSAKSI");
app.post("/cekroute", (req, res) => {
  res.send("ROUTE AKTIF");
});
app.get("/tes123", (req, res) => {
  res.send("SERVER LATANSA TERBARU");
});
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("=== SERVER BARU LATANSA AKTIF ===");
});
