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

// ... your existing setup and CSV loading code ...

// ✅ RESTful API endpoints (put this at the bottom of index.js)
// ✅ All users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error("DB error in /api/users:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(rows);
  });
});

// ✅ Single user by ID
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error("DB error in /api/users/:id:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(row);
  });
});

// ✅ Total users
app.get('/api/stats/total-users', (req, res) => {
  db.get('SELECT COUNT(*) AS total FROM users', (err, row) => {
    if (err) {
      console.error("DB error in /api/stats/total-users:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(row);
  });
});

// ✅ Average age
app.get('/api/stats/average-age', (req, res) => {
  db.get('SELECT AVG(age) AS average_age FROM users WHERE age IS NOT NULL', (err, row) => {
    if (err) {
      console.error("DB error in /api/stats/average-age:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(row);
  });
});

// ✅ Users by gender
app.get('/api/stats/users-by-gender', (req, res) => {
  db.all('SELECT gender, COUNT(*) AS count FROM users GROUP BY gender', (err, rows) => {
    if (err) {
      console.error("DB error in /api/stats/users-by-gender:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(rows);
  });
});

// ✅ Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});


app.listen(3001, () => console.log('Server started on port 3001'));

//for orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) {
      console.error("DB error in /api/orders:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(rows);
  });
});


app.get('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid order ID" });

  db.get('SELECT * FROM orders WHERE order_id = ?', [id], (err, row) => {
    if (err) {
      console.error("DB error in /api/orders/:id:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!row) return res.status(404).json({ error: "Order not found" });

    res.json(row);
  });
});

app.get('/api/users/:id/orders', (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });

  db.all('SELECT * FROM orders WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error("DB error in /api/users/:id/orders:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (!rows.length) return res.status(404).json({ error: "No orders found for this user" });

    res.json(rows);
  });
});

// Total orders
app.get('/api/stats/total-orders', (req, res) => {
  db.get('SELECT COUNT(*) AS total_orders FROM orders', (err, row) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.json(row);
  });
});

// Average items per order
app.get('/api/stats/average-items', (req, res) => {
  db.get('SELECT AVG(num_of_item) AS avg_items FROM orders', (err, row) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.json(row);
  });
});

// Orders grouped by status
app.get('/api/stats/orders-by-status', (req, res) => {
  db.all('SELECT status, COUNT(*) AS count FROM orders GROUP BY status', (err, rows) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    res.json(rows);
  });
});
