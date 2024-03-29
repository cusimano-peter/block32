const express = require("express");
const app = express();
const path = require("path");
const { Client } = require("pg");

const client = new Client({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost/acme_flavors_db",
});

//Middleware
app.use(express.json());

app.use(express.static(path.join(__dirname, "../dist")));

app.use(require("morgan")("dev"));

app.get("/", (req, res) => {
  res.send("Welcome to the ACME Flavors API!");
});

// GET all flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM flavors";
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

// GET a single flavor by id
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log("ID from URL:", req.params.id);
    console.log("ID:", id, typeof id);
    const SQL = "SELECT * FROM flavors WHERE id = $1";
    const response = await client.query(SQL, [id]);
    console.log(response);
    if (response.rows.length === 0) {
      return res.status(404).send("Flavor not found");
    }
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID format");
    }
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// POST a new flavor
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL =
      "INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.status(201).send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// DELETE a flavor by id
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID format");
    }
    const SQL = "DELETE FROM flavors WHERE id = $1";
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});
console.log("WHYYYYYYYY");
// PUT (update) a flavor by id
app.put("/api/flavors/:id", async (req, res, next) => {
  console.log("NOOOOOOO");
  try {
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID format");
    }
    const SQL =
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      id,
    ]);
    if (response.rows.length === 0) {
      return res.status(404).send("Flavor not found");
    }
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// create and run the express app
async function init() {
  try {
    await client.connect();
    console.log("Connected to database.");

    let SQL = `
            DROP TABLE IF EXISTS flavors;
            CREATE TABLE flavors (
                id SERIAL PRIMARY KEY NOT NULL,
                name VARCHAR(255) NOT NULL,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    await client.query(SQL);
    console.log("Database initialized.");
    SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('Rocky-Road', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
  `;
    await client.query(SQL);
    console.log("data seeded");
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error("Failed to connect to the database or initialize it", err);
  }
}

init();
