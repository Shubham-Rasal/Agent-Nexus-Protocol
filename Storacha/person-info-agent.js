import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JSDOM } from "jsdom";

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
  constructor(googleApiKey, googleAPiKeySearch, searchEngineId) {
    this.googleApiKey = googleApiKey;
    console.log(`Google API Key: ${googleApiKey}`);
    this.googleAPiKeySearch = googleAPiKeySearch;
    console.log(`Google Search API Key: ${googleAPiKeySearch}`);
    this.searchEngineId = searchEngineId;
    console.log(`Search Engine ID: ${searchEngineId}`);
    this.genAI = new GoogleGenerativeAI(googleApiKey);
    this.sessionId = new Date().toISOString().replace(/[:.]/g, "_");
    this.currentPerson = null;
    this.webData = [];
    this.index = null;
  }

  async searchPerson(name, numResults = 5) {
    this.currentPerson = name;
    const query = encodeURIComponent(`${name} biography information`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleAPiKeySearch}&cx=${this.searchEngineId}&q=${query}&num=${numResults}`;
    console.log(`Searching for ${name} at ${url}`);
    this._saveComponent("cot", `Searching for ${name}`, `search_${name}`);

    try {
      const response = await axios.get(url);
      const results = (response.data.items || []).map((item) => ({
        title: item.title,
        snippet: item.snippet,
        source: item.link,
      }));
      this._saveComponent("web_data", JSON.stringify(results, null, 2), `search_results_${name}`);
      return results;
    } catch (err) {
      const errorMsg = `Error searching for ${name}: ${err.message}`;
      this._saveComponent("web_data", errorMsg, `search_error_${name}`);
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
      this._saveComponent("web_data", pageContent.slice(0, 1000), `content_${i}_${personName}`);
    }

    this.index = docs;
    this._saveComponent("index_data", JSON.stringify(docs, null, 2), `index_${personName}`);
  }

  async answerQuery(query) {
    if (!this.index) {
      throw new Error("Knowledge base not created yet.");
    }
    this._saveComponent("input", query, `query_${this.currentPerson}`);

    const context = this.index.map((doc, i) => `Source ${i + 1}: ${doc.source}\n${doc.content}`).join("\n\n");
    const prompt = `Using the following context about ${this.currentPerson}, answer this: ${query}\n\n${context}`;
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    this._saveComponent("output", answer, `answer_${this.currentPerson}`);
    return answer;
  }

  _saveComponent(componentType, content, identifier) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    const filename = `${timestamp}_${identifier}.txt`;
    const filepath = path.join(BASE_DIR, componentType, filename);
    fs.writeFileSync(filepath, content);

    const metadata = {
      timestamp: new Date().toISOString(),
      componentType,
      identifier,
      person: this.currentPerson,
      sessionId: this.sessionId,
      filePath: filepath,
    };
    const metaPath = path.join(BASE_DIR, "metadata", `${timestamp}_${identifier}_meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  }
}

// Example usage
(async () => {
  // Load API keys from environment variables instead of hardcoding
  const googleApiKey = process.env.GOOGLE_API_KEY_LLM;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const googleAPiKeySearch = process.env.GOOGLE_API_KEY_SEARCH;
  
  if (!googleApiKey || !searchEngineId || !googleAPiKeySearch) {
    console.error("Please set GOOGLE_API_KEY_LLM, GOOGLE_API_KEY_SEARCH, and GOOGLE_API_KEY_SEARCH environment variables");
    process.exit(1);
  }
  
  const agent = new PersonInfoAgent(googleApiKey, googleAPiKeySearch, searchEngineId);
  const person = "Albert Einstein";
  await agent.createKnowledgeBase(person);
  const answer = await agent.answerQuery("What was Einstein's biggest contribution to science?");
  console.log("Answer:", answer);
})();