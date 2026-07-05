const DATABASE_NAME = "quiz_db"

const COLLECTION_NAME = "questions"

print("Starting MongoDB...")

// init_quiz_db.js — what's left
db = db.getSiblingDB(DATABASE_NAME);
if (!db.getCollectionNames().includes(COLLECTION_NAME)) db.createCollection(COLLECTION_NAME);
db.questions.createIndex({ type: 1 });
db.questions.createIndex({ category: 1 }, { partialFilterExpression: { type: "SINGLE_OPTION" } });

print("MongodDB initialized!")
