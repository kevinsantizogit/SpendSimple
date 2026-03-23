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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/api`);
});