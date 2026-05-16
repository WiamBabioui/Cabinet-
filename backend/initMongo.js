import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

async function initDB() {
  try {
    await client.connect();

    const db = client.db("cabinet_plus");

    // Collections
    await db.createCollection("conversations");
    await db.createCollection("messages");
    await db.createCollection("notifications");
    await db.createCollection("activitylogs");
    await db.createCollection("consultationhistories");

    console.log("Collections created");

    // INDEXES

    // conversations
    await db.collection("conversations").createIndex({ participants: 1 });
    await db.collection("conversations").createIndex({ updatedAt: -1 });

    // messages
    await db.collection("messages").createIndex({
      conversationId: 1,
      createdAt: -1,
    });

    await db.collection("messages").createIndex({
      senderId: 1,
      createdAt: -1,
    });

    await db.collection("messages").createIndex({
      receiverId: 1,
      createdAt: -1,
    });

    // notifications
    await db.collection("notifications").createIndex({
      userId: 1,
      createdAt: -1,
    });

    await db.collection("notifications").createIndex({
      userId: 1,
      isRead: 1,
    });

    // activitylogs
    await db.collection("activitylogs").createIndex({
      userId: 1,
      createdAt: -1,
    });

    await db.collection("activitylogs").createIndex({
      patientId: 1,
      createdAt: -1,
    });

    await db.collection("activitylogs").createIndex({
      module: 1,
      createdAt: -1,
    });

    // consultationhistories
    await db.collection("consultationhistories").createIndex({
      patientId: 1,
      consultationDate: -1,
    });

    await db.collection("consultationhistories").createIndex({
      doctorId: 1,
      consultationDate: -1,
    });

    console.log("Indexes created");
    console.log("MongoDB initialized successfully");

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

initDB();