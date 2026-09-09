const db = require('./db');

async function run() {
  try {
    await db.query("ALTER TABLE users ADD COLUMN company_name VARCHAR(255) DEFAULT 'My Company'");
    console.log("Successfully added company_name to users table");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("company_name column already exists");
    } else {
      console.error("Error adding column:", err.message);
    }
  } finally {
    process.exit(0);
  }
}

run();
