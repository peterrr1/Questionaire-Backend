const fs = require('fs')

const collectionId = new ObjectId()

const DATABASE_NAME = "quiz_db"
//const COLLECTION_NAME = "quiz_" + collectionId.toString()
const COLLECTION_NAME = process.env.DEFAULT_COLLECTION_ID
const POPULATE_QUESTIONS_JSON = "/docker-entrypoint-initdb.d/questions.json"


print("Starting MongoDB init script...");

db = db.getSiblingDB(DATABASE_NAME);

if (!db.getCollectionNames().includes(COLLECTION_NAME)) {
  db.createCollection(COLLECTION_NAME);
}

function question(type, category, text, options, correctOptionIndex) {
  const optionIds = options.map(() => new ObjectId().toString());
  
  const correctOptionIds = type === "SINGLE_OPTION"
    ? optionIds[correctOptionIndex-1]
    : correctOptionIndex.map(x => optionIds[x-1])
  

  return {
    type: type,
    category: category,
    question: text,
    correct_option: correctOptionIds,
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
            q.answer
        )
    )
    print(`Loaded ${document.length} questions from JSON file`);

    if (document.length > 0) {
      db.getCollection(COLLECTION_NAME).insertMany(document)
    }
    print("MongoDB init script completed successfully");
} catch (e) {
    print("Could not load questions.json:");
    print(e);
}

