const containerClient = require("./blob");

async function testConnection() {
  try {
    await containerClient.getProperties();
    console.log("Azure Blob Storage connected successfully!");
  } catch (error) {
    console.error("Blob Storage error:", error.message);
  }
}

testConnection();
