const fs = require('fs')

const DATABASE_NAME = "quiz_db"
//const COLLECTION_NAME = "quiz_" + collectionId.toString()
const COLLECTION_NAME = "questions"
const SEED_QUIZ_ID = process.env.DEFAULT_QUIZ_ID

const POPULATE_QUESTIONS_JSON = "/docker-entrypoint-initdb.d/questions.json"


print("Starting MongoDB init script...");

db = db.getSiblingDB(DATABASE_NAME);

if (!db.getCollectionNames().includes(COLLECTION_NAME)) {
  db.createCollection(COLLECTION_NAME);
}

db.getCollection(COLLECTION_NAME).createIndex({ quiz_id: 1, category: 1 })

function question(type, category, text, options, correctOptionIndex, category_display_name) {
  const optionIds = options.map(() => new ObjectId().toString());
  
  const correctOptionIds = type === "SINGLE_OPTION"
    ? optionIds[correctOptionIndex-1]
    : correctOptionIndex.map(x => optionIds[x-1])
  

  return {
    quiz_id: SEED_QUIZ_ID,
    type: type,
    category: category,
    question: text,
    correct_option: correctOptionIds,
    category_display_name: category_display_name,
    options: options.map((optionObj, index) => ({
      _id: optionIds[index],
      option: optionObj.text
    }))
  };
}


try {
    if (!fs.existsSync(POPULATE_QUESTIONS_JSON)) {
        throw new Error("questions.json not found");
    }
    const raw = fs.readFileSync(POPULATE_QUESTIONS_JSON, 'utf-8');

    const questionsJson = JSON.parse(raw);

    const document = questionsJson.map(q =>
        question(
            q.type,
            q.category,
            q.text,
            q.options,
            q.answer,
            q.category_display_name
        )
    )
    print(`Loaded ${document.length} questions from JSON file`);

    const alreadySeeded = db.getCollection(COLLECTION_NAME).countDocuments({ quiz_id: SEED_QUIZ_ID}) > 0


    if (document.length > 0 && !alreadySeeded) {
      db.getCollection(COLLECTION_NAME).insertMany(document)
    }
    print("MongoDB init script completed successfully");
} catch (e) {
    print("Could not load questions.json:");
    print(e);
}

