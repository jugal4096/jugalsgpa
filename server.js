import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ===============================
LOAD KNOWLEDGE FILES
================================ */

let nep = "";
let cbcs = "";
let jugalProfile = "";

/* developer profile */

try {

jugalProfile = fs.readFileSync(
"./knowledge/jugal_profile.txt",
"utf8"
);

console.log("Developer profile loaded");

} catch {

console.log("Developer profile not found");

}

/* NEP knowledge */

try {

nep = fs.readFileSync(
"./knowledge/nep.txt",
"utf8"
);

console.log("NEP knowledge loaded");

} catch {

console.log("nep.txt not found");

}

/* CBCS knowledge */

try {

cbcs = fs.readFileSync(
"./knowledge/ncbcs.txt",
"utf8"
);

console.log("CBCS knowledge loaded");

} catch {

console.log("ncbcs.txt not found");

}


/* ===============================
SEARCH RELEVANT TEXT
================================ */

function getRelevantText(doc, query){

if(!doc) return "";

const words = query.toLowerCase().split(" ");

const lines = doc.split("\n");

const matches = lines.filter(line =>
words.some(word =>
line.toLowerCase().includes(word)
)
);

return matches.slice(0,8).join("\n");

}


/* ===============================
AI CLIENT
================================ */

const client = new OpenAI({

apiKey: process.env.GROQ_API_KEY,

baseURL: "https://api.groq.com/openai/v1"

});


/* ===============================
AI ROUTE
================================ */

app.post("/ai", async (req,res)=>{

try{

const userMessage = (req.body.message || "").toLowerCase();

console.log("User:", userMessage);

let sourceDoc = "";


/* detect scheme */

if(userMessage.includes("nep")){

sourceDoc = nep;

}

else if(

userMessage.includes("cbcs") ||
userMessage.includes("credit") ||
userMessage.includes("semester")

){

sourceDoc = cbcs;

}


/* extract relevant knowledge */

const knowledge = getRelevantText(sourceDoc,userMessage);


/* AI request */

const completion = await client.chat.completions.create({

model:"llama-3.1-8b-instant",

messages:[

{
role:"system",
content:`

You are GECA's Panda 🐼.

You are an AI academic assistant for students of
Government College of Engineering Aurangabad.

Important fact:
You were created by Jugal Pakhare, an IT engineering student.

If someone asks:
Who created you
Who is your developer
Who made you

You must reply:
"I was created by Jugal Pakhare, an IT engineering student at GECA."

Developer information:

${jugalProfile}

Academic knowledge:

${knowledge}

Respond in a friendly helpful tone.

`
},

{
role:"user",
content:userMessage
}

]

});

const reply = completion.choices[0].message.content;

res.json({reply});

}catch(error){

console.log("API ERROR:",error.message);

res.json({
reply:"🐼 Panda couldn't answer right now"
});

}

});


/* ===============================
START SERVER
================================ */

app.listen(PORT,()=>{

console.log("🐼 AI running on port",PORT);

});
