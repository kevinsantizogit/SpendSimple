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

//Gets data from req.body, SQL uses ?? as placeholders while the actual values are passed 
//Into the array
//SQlite safely binds and this.lastID gives me the new record ID
app.post("/api", (req, res) => {
  const { title, amount, date, category, note } = req.body;

  db.run(
    `INSERT INTO expenses (title, amount, date, category, note)
     VALUES (?, ?, ?, ?, ?)`,
    [title, amount, date, category, note],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ status: `New record created with id=${this.lastID}` });
    }
  );
});
//GET /api, gets route parameter from req.params.id and then it converts it to a number
//Queries one record with db.get and returns one object
//or else expense not found is returned
app.get("/api/:id", (req, res) => {
  const id = Number(req.params.id);

  db.get("SELECT * FROM expenses WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(row);
  });
});

//User here sends a PUT request with updated expense data
//Then the route finds record by ID and overwrites the DB with the fields
app.put("/api/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, amount, date, category, note } = req.body;

  db.run(
    `UPDATE expenses
     SET title = ?, amount = ?, date = ?, category = ?, note = ?
     WHERE id = ?`,
    [title, amount, date, category, note, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ status: `Record id=${id} updated` });
    }
  );
});

//Delete request with ID in URL
//route pulls the ID from req.params.id and then a SQL DELETE is ran to targe the specified record
//Confirmation or error is returned
app.delete("/api/:id", (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM expenses WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ status: `Record id=${id} deleted` });
  });
});

//DELETE is sent to /api without a target
//SQL Delete is run with no WHERE clause to wipe the entire table
//Confirmation is returned 
app.delete("/api", (req, res) => {
  db.run("DELETE FROM expenses", [], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ status: "Collection deleted" });
  });
});

//Put is used to receive an array of expense objects in the req.body
//DELETE wipes the entire table
//Statement looped through the array and reinserted one by one
//replacing an entire collection in one go
app.put("/api", (req, res) => {
  const items = req.body;

  db.serialize(() => {
    db.run("DELETE FROM expenses");

    const stmt = db.prepare(
      `INSERT INTO expenses (title, amount, date, category, note)
       VALUES (?, ?, ?, ?, ?)`
    );

    items.forEach((item) => {
      stmt.run(item.title, item.amount, item.date, item.category, item.note);
    });

    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ status: "Collection replaced" });
    });
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