import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JSDOM } from "jsdom";
import FormData from "form-data";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Load environment variables
dotenv.config();

// Constants
const STORAGE_COMPONENTS = [
  "input",
  "output",
  "cot",
  "web_data",
  "metadata",
];

const BASE_DIR = "data_store";
STORAGE_COMPONENTS.forEach((component) => {
  fs.mkdirSync(path.join(BASE_DIR, component), { recursive: true });
});

// Database path
const DB_PATH = path.join(BASE_DIR, "files.db");

class FileDatabase {
  constructor() {
    this.db = null;
  }

  async initialize() {
    // Open the database
    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Create simplified file table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        cid TEXT NOT NULL,
        file_type TEXT NOT NULL,
        person TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);
  }

  async addFile(fileInfo) {
    try {
      const { filename, cid, fileType, person, timestamp } = fileInfo;

      await this.db.run(
        `INSERT INTO files (filename, cid, file_type, person, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [filename, cid, fileType, person, timestamp]
      );
      
      return true;
    } catch (error) {
      console.error("Error adding file to database:", error);
      return false;
    }
  }

  async getFilesByCID(cid) {
    try {
      return await this.db.all(`SELECT * FROM files WHERE cid = ?`, [cid]);
    } catch (error) {
      console.error("Error getting files by CID:", error);
      return [];
    }
  }

  async getFilesByPerson(person) {
    try {
      return await this.db.all(`SELECT * FROM files WHERE person = ?`, [person]);
    } catch (error) {
      console.error("Error getting files by person:", error);
      return [];
    }
  }

  async getFilesByType(fileType) {
    try {
      return await this.db.all(`SELECT * FROM files WHERE file_type = ?`, [fileType]);
    } catch (error) {
      console.error("Error getting files by type:", error);
      return [];
    }
  }

  async getAllFiles() {
    try {
      return await this.db.all(`SELECT * FROM files ORDER BY timestamp DESC`);
    } catch (error) {
      console.error("Error getting all files:", error);
      return [];
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

class PersonInfoAgent {
  constructor(googleApiKey, googleAPiKeySearch, searchEngineId, uploadApiUrl) {
    this.googleApiKey = googleApiKey;
    this.googleAPiKeySearch = googleAPiKeySearch;
    this.searchEngineId = searchEngineId;
    this.uploadApiUrl = uploadApiUrl || 'http://127.0.0.1:3000/upload';
    this.genAI = new GoogleGenerativeAI(googleApiKey);
    this.sessionId = new Date().toISOString().replace(/[:.]/g, "_");
    this.currentPerson = null;
    this.webData = [];
    this.index = null;
    this.uploadedFiles = [];
    this.db = new FileDatabase();
  }

  async initialize() {
    await this.db.initialize();
  }

  async searchPerson(name, numResults = 5) {
    this.currentPerson = name;
    
    const query = encodeURIComponent(`${name} biography information`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleAPiKeySearch}&cx=${this.searchEngineId}&q=${query}&num=${numResults}`;
    console.log(`Searching for ${name} at ${url}`);
    
    const searchLog = `Started search for information about ${name} using Google Custom Search API.\nQuery: "${name} biography information"\nEndpoint: ${url}\nTimestamp: ${new Date().toISOString()}`;
    const searchLogPath = await this._saveComponent("metadata", searchLog, `search_log_${name}`);
    await this._uploadFile(searchLogPath, "metadata");

    try {
      const response = await axios.get(url);
      const results = (response.data.items || []).map((item) => ({
        title: item.title,
        snippet: item.snippet,
        source: item.link,
      }));
      
      const webDataFilePath = await this._saveComponent("web_data", JSON.stringify(results, null, 2), `search_results_${name}`);
      await this._uploadFile(webDataFilePath, "web_data");
      
      return results;
    } catch (err) {
      const errorMsg = `Error searching for ${name}: ${err.message}`;
      const errorFilePath = await this._saveComponent("web_data", errorMsg, `search_error_${name}`);
      await this._uploadFile(errorFilePath, "web_data");
      
      console.error(errorMsg);
      return [];
    }
  }

  async fetchPageContent(url) {
    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const dom = new JSDOM(response.data);
      const text = dom.window.document.body.textContent || "";
      return text.slice(0, 10000);
    } catch (err) {
      const errorMsg = `Failed to fetch ${url}: ${err.message}`;
      console.error(errorMsg);
      return errorMsg;
    }
  }

  async createKnowledgeBase(personName) {
    const results = await this.searchPerson(personName);
    const docs = [];

    for (let i = 0; i < results.length && i < 3; i++) {
      const { title, snippet, source } = results[i];
      docs.push({ source, content: `${title}\n${snippet}` });
      const pageContent = await this.fetchPageContent(source);
      docs.push({ source, content: pageContent });
      
      const contentFilePath = await this._saveComponent("web_data", pageContent.slice(0, 1000), `content_${i}_${personName}`);
      await this._uploadFile(contentFilePath, "web_data");
    }

    this.index = docs;
    const indexFilePath = await this._saveComponent("metadata", JSON.stringify(docs, null, 2), `index_${personName}`);
    await this._uploadFile(indexFilePath, "metadata");
  }

  async answerQuery(query) {
    if (!this.index) {
      throw new Error("Knowledge base not created yet.");
    }
    
    const inputFilePath = await this._saveComponent("input", query, `query_${this.currentPerson}`);
    await this._uploadFile(inputFilePath, "input");

    const context = this.index.map((doc, i) => `Source ${i + 1}: ${doc.source}\n${doc.content}`).join("\n\n");
    
    // First, get the chain of thought (reasoning process)
    const cotPrompt = `Using the following context about ${this.currentPerson}, think step by step to answer this question: ${query}

Context:
${context}

I want you to walk through your reasoning process in detail before providing a final answer. Consider relevant information from the sources, evaluate contradicting evidence if any, and explain how you're forming your conclusion. Start with "Let me think through this step by step:" and end with "Final answer:"`;

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const cotResult = await model.generateContent(cotPrompt);
    const chainOfThought = cotResult.response.text();
    
    // Save the chain of thought
    const cotFilePath = await this._saveComponent("cot", chainOfThought, `reasoning_${this.currentPerson}`);
    await this._uploadFile(cotFilePath, "cot");
    
    // Extract the final answer (assuming it comes after "Final answer:")
    let finalAnswer = chainOfThought;
    if (chainOfThought.includes("Final answer:")) {
      finalAnswer = chainOfThought.split("Final answer:")[1].trim();
    }
    
    // Save the final answer
    const outputFilePath = await this._saveComponent("output", finalAnswer, `answer_${this.currentPerson}`);
    await this._uploadFile(outputFilePath, "output");
    
    return {
      chainOfThought,
      finalAnswer
    };
  }

  async _saveComponent(fileType, content, identifier) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    const filename = `${timestamp}_${identifier}.txt`;
    const filepath = path.join(BASE_DIR, fileType, filename);
    
    // Ensure the directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    // Write the file
    await fs.promises.writeFile(filepath, content);
    
    return filepath;
  }

  async _uploadFile(filePath, fileType) {
    try {
      console.log(`Uploading file: ${filePath}`);
      
      // Create form data
      const form = new FormData();
      
      // Use a readable stream for the file
      form.append('file', fs.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: 'text/plain',
      });
      
      // Make the request
      const response = await axios.post(this.uploadApiUrl, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      console.log(`File uploaded successfully: ${filePath}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
      
      // Store file info
      const fileInfo = {
        filename: path.basename(filePath),
        cid: response.data.cid,
        fileType,
        person: this.currentPerson,
        timestamp: new Date().toISOString()
      };
      
      this.uploadedFiles.push(fileInfo);
      
      // Store in database
      await this.db.addFile(fileInfo);
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading file ${filePath}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return null;
    }
  }
  
  // Get list of all uploaded files during this session
  getUploadedFiles() {
    return this.uploadedFiles;
  }
  
  // Get all files from the database for a specific person
  async getFilesByPerson(person) {
    return await this.db.getFilesByPerson(person);
  }
  
  // Get all files from the database for a specific type
  async getFilesByType(fileType) {
    return await this.db.getFilesByType(fileType);
  }
  
  // Get all files from the database
  async getAllFiles() {
    return await this.db.getAllFiles();
  }
  
  // Close database connection
  async cleanup() {
    await this.db.close();
  }
}

// Example usage
(async () => {
  // Load API keys from environment variables
  const googleApiKey = process.env.GOOGLE_API_KEY_LLM;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const googleAPiKeySearch = process.env.GOOGLE_API_KEY_SEARCH;
  const uploadApiUrl = process.env.UPLOAD_API_URL || 'http://127.0.0.1:3000/upload';
  
  if (!googleApiKey || !searchEngineId || !googleAPiKeySearch) {
    console.error("Please set GOOGLE_API_KEY_LLM, GOOGLE_API_KEY_SEARCH, and GOOGLE_SEARCH_ENGINE_ID environment variables");
    process.exit(1);
  }
  
  try {
    const agent = new PersonInfoAgent(googleApiKey, googleAPiKeySearch, searchEngineId, uploadApiUrl);
    
    // Initialize the database
    await agent.initialize();
    
    const person = "Albert Einstein";
    await agent.createKnowledgeBase(person);
    
    const query = "What was Einstein's biggest contribution to science?";
    const { chainOfThought, finalAnswer } = await agent.answerQuery(query);
    
    console.log("\n--- Chain of Thought ---");
    console.log(chainOfThought);
    
    console.log("\n--- Final Answer ---");
    console.log(finalAnswer);
    
    // Get all CoT files
    const cotFiles = await agent.getFilesByType("cot");
    console.log(`\nChain of Thought files (${cotFiles.length}):`);
    console.table(cotFiles.map(file => ({
      filename: file.filename,
      cid: file.cid,
      person: file.person,
      timestamp: file.timestamp
    })));
    
    // Proper cleanup
    await agent.cleanup();
  } catch (error) {
    console.error("Error in main process:", error);
  }
})();