import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JSDOM } from "jsdom";
import FormData from "form-data";

// Load environment variables
dotenv.config();

// Constants
const STORAGE_COMPONENTS = [
  "input",
  "output",
  "cot",
  "code_artifacts",
  "web_data",
  "metadata",
  "index_data",
];

const BASE_DIR = "data_store";
STORAGE_COMPONENTS.forEach((component) => {
  fs.mkdirSync(path.join(BASE_DIR, component), { recursive: true });
});

class PersonInfoAgent {
  constructor(googleApiKey, googleAPiKeySearch, searchEngineId, uploadApiUrl) {
    this.googleApiKey = googleApiKey;
    this.googleAPiKeySearch = googleAPiKeySearch;
    this.searchEngineId = searchEngineId;
    this.uploadApiUrl = uploadApiUrl || 'http://127.0.0.1:3000/upload'; // Default to local server if not provided
    this.genAI = new GoogleGenerativeAI(googleApiKey);
    this.sessionId = new Date().toISOString().replace(/[:.]/g, "_");
    this.currentPerson = null;
    this.webData = [];
    this.index = null;
    this.uploadedFiles = [];
  }

  async searchPerson(name, numResults = 5) {
    this.currentPerson = name;
    const query = encodeURIComponent(`${name} biography information`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleAPiKeySearch}&cx=${this.searchEngineId}&q=${query}&num=${numResults}`;
    console.log(`Searching for ${name} at ${url}`);
    
    const cotFilePath = await this._saveComponent("cot", `Searching for ${name}`, `search_${name}`);
    await this._uploadFile(cotFilePath);

    try {
      const response = await axios.get(url);
      const results = (response.data.items || []).map((item) => ({
        title: item.title,
        snippet: item.snippet,
        source: item.link,
      }));
      
      const webDataFilePath = await this._saveComponent("web_data", JSON.stringify(results, null, 2), `search_results_${name}`);
      await this._uploadFile(webDataFilePath);
      
      return results;
    } catch (err) {
      const errorMsg = `Error searching for ${name}: ${err.message}`;
      const errorFilePath = await this._saveComponent("web_data", errorMsg, `search_error_${name}`);
      await this._uploadFile(errorFilePath);
      
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
      await this._uploadFile(contentFilePath);
    }

    this.index = docs;
    const indexFilePath = await this._saveComponent("index_data", JSON.stringify(docs, null, 2), `index_${personName}`);
    await this._uploadFile(indexFilePath);
  }

  async answerQuery(query) {
    if (!this.index) {
      throw new Error("Knowledge base not created yet.");
    }
    
    const inputFilePath = await this._saveComponent("input", query, `query_${this.currentPerson}`);
    await this._uploadFile(inputFilePath);

    const context = this.index.map((doc, i) => `Source ${i + 1}: ${doc.source}\n${doc.content}`).join("\n\n");
    const prompt = `Using the following context about ${this.currentPerson}, answer this: ${query}\n\n${context}`;
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    const outputFilePath = await this._saveComponent("output", answer, `answer_${this.currentPerson}`);
    await this._uploadFile(outputFilePath);
    
    return answer;
  }

  async _saveComponent(componentType, content, identifier) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    const filename = `${timestamp}_${identifier}.txt`;
    const filepath = path.join(BASE_DIR, componentType, filename);
    
    // Ensure the directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    // Write the file
    await fs.promises.writeFile(filepath, content);

    const metadata = {
      timestamp: new Date().toISOString(),
      componentType,
      identifier,
      person: this.currentPerson,
      sessionId: this.sessionId,
      filePath: filepath,
    };
    
    const metaPath = path.join(BASE_DIR, "metadata", `${timestamp}_${identifier}_meta.json`);
    await fs.promises.mkdir(path.dirname(metaPath), { recursive: true });
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2));
    
    return filepath;
  }

  async _uploadFile(filePath) {
    try {
      console.log(`Uploading file: ${filePath}`);
      
      // Create form data using a different approach
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
      
      // Store upload information
      this.uploadedFiles.push({
        filePath,
        cid: response.data.cid,
        timestamp: new Date().toISOString()
      });
      
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
  
  const agent = new PersonInfoAgent(googleApiKey, googleAPiKeySearch, searchEngineId, uploadApiUrl);
  const person = "Albert Einstein";
  await agent.createKnowledgeBase(person);
  const answer = await agent.answerQuery("What was Einstein's biggest contribution to science?");
  console.log("Answer:", answer);
  
  // Display all uploaded files
  console.log("Uploaded files:", JSON.stringify(agent.getUploadedFiles(), null, 2));
})();