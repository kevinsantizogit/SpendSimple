const express = require ("express");
const sqlite3 = require ("sqlite3").verbose();
const cors = require ("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./expenses.db", (err) => {
  if (err) {
    console.error("Could not connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

//Gets rows from SQLite and returns the array of expense objects to client as JSON
app.get("/api", (req, res) => {
  db.all("SELECT * FROM expenses", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/api`);
});

//Create table
db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title    TEXT,
    amount   REAL,
    date     TEXT,
    category TEXT,
    note     TEXT
  )`);