console.log("Server is starting...");

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');
const app = express();

app.use(cors());
const db = new sqlite3.Database('./ecommerce.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT,
    state TEXT,
    street_address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT,
    latitude REAL,
    longitude REAL,
    traffic_source TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    status TEXT,
    gender TEXT,
    created_at TEXT,
    returned_at TEXT,
    shipped_at TEXT,
    delivered_at TEXT,
    num_of_item INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Load CSV data
function loadCSV(filePath, tableName, columns) {
  console.log(`Loading ${filePath} into ${tableName}...`);
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
       // 👈 This will confirm reading is working
      const values = columns.map(col => row[col]);
      db.run(
        `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
        values
      );
    })
    .on('end', () => {
      console.log(`✅ Finished loading ${tableName}`);
    })
    .on('error', (err) => {
      console.error(`❌ Error loading ${filePath}:`, err.message);
    });
}

// function loadCSV(filePath, tableName, columns) {
//   fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('data', (row) => {
//       const values = columns.map(col => row[col]);
//       db.run(
//         `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
//         values
//       );
//     })
//     .on('end', () => {
//       console.log(`Finished loading ${tableName}`);
//     });
// }

// Load on start (you can call only once)
loadCSV('./users.csv', 'users', [
  'id', 'first_name', 'last_name', 'email', 'age', 'gender', 'state',
  'street_address', 'postal_code', 'city', 'country', 'latitude',
  'longitude', 'traffic_source', 'created_at'
]);

loadCSV('./orders.csv', 'orders', [
  'order_id', 'user_id', 'status', 'gender', 'created_at',
  'returned_at', 'shipped_at', 'delivered_at', 'num_of_item'
]);


// APIs
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.get('/orders', (req, res) => {
  db.all('SELECT * FROM orders LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.listen(3001, () => console.log('Server started on port 3001'));
