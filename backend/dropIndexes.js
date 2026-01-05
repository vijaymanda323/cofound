require("dotenv").config(); // ✅ LOAD .env
const mongoose = require("mongoose");

(async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/found";
    console.log("📌 URI:", uri);

    await mongoose.connect(uri);

    console.log("✅ Connected to DB:", mongoose.connection.name);

    const collections = await mongoose.connection.db.collections();

    if (collections.length === 0) {
      console.log("⚠️ No collections found in database");
    }

    for (const collection of collections) {
      console.log(`📂 Collection: ${collection.collectionName}`);

      const indexes = await collection.indexes();

      for (const index of indexes) {
        if (index.name !== "_id_") {
          await collection.dropIndex(index.name);
          console.log(`🗑️ Dropped index ${index.name}`);
        }
      }
    }

    console.log("🎉 DONE: All old indexes removed");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
})();
