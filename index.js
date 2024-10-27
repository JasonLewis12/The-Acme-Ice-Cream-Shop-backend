//importing
const express = require("express");
const app = express();
const pg = require("pg");
PORT = 8080;
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/icecream"
);

// connects database to server/express
client.connect((error) => {
  if (error) {
    console.error("there was an error connecting", error);
  } else {
    console.log("connected");
    init();
  }
});

async function init() {
  app.listen(PORT); // listen on port
  try {
    await client.query("DROP TABLE IF EXISTS flavor"); //droping table if exists
  } catch (error) {
    console.error("there was an error dropping table");
  }

  try {
    // createing new table for data
    await client.query(`
    CREATE TABLE flavor (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    is_favorite BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP);`);
    console.log("table created");
  } catch (error) {
    console.error("there was an error creating table");
  }

  try {
    // inseting data into table
    await client.query(`
    INSERT INTO flavor ( name, is_favorite,created_at)
    VALUES ('vanilla', true,  NOW()),
    ('chocolate', false,  NOW());
    `);
    console.log("basic info added to table");
  } catch (error) {
    console.error("there was an error inserting basic info", error);
  }
  app.use(express.json());
  //*******************************ROUTES!!******************************************** */
  //get all flavors
  app.get("/api/flavors", async (req, res) => {
    try {
      const result = await client.query(`SELECT * FROM flavor;`);
      res.json(result.rows);
    } catch (error) {
      console.erorr("there was an error on your /GET");
    }
  });

  //get single flavor
  app.get("/api/flavors/:id", async (req, res) => {
    const flavorId = req.params.id;
    try {
      const result = await client.query(`SELECT * FROM flavor WHERE id = $1;`, [
        flavorId,
      ]);
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "flavor not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("there was an error on /GET single flavor", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  //add new flavor
  app.post("/api/flavors", async (req, res) => {
    const { name, is_favorite } = req.body;
    try {
      const result = await client.query(
        `INSERT INTO flavor (name, is_favorite, created_at)
            VALUES ($1, $2, NOW()) RETURNING *;`,
        [name, is_favorite]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error at /api/flavors POST:", error);
    }
  });

  //update flavor
  app.put("/api/flavors/:id", async (req, res) => {
    const flavorId = req.params.id;
    const { name, is_favorite } = req.body;
    try {
      const result = await client.query(
        `
            UPDATE flavor SET name = $1, is_favorite = $2,  updated_at = NOW()
            WHERE id = $3
            RETURNING *;
            `,
        [name, is_favorite, flavorId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "flavor not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("there was an error updating a flavor");
    }
  });

  //delete a flavor
  app.delete("/api/flavors/:id", async (req, res) => {
    const flavorId = req.params.id;
    try {
      const result = await client.query(
        `
        DELETE FROM flavor WHERE id = S1 RETURNING *;`,
        [flavorId]
      );
    } catch (error) {
      console.error("there was an error deleteing a flavor");
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "flavor not found" });
      }
      res.status(200).json({ message: "flavor has been deleted successfully" });
    }
  });
}
