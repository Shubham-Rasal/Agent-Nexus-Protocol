import { FunctionTool } from "llamaindex";
import { websearch } from "./web-search";
import { akaveStorage } from "./akave-storage";
import { leadQualification } from "./lead-qualification";

export const webSearch = new FunctionTool(websearch, {
  name: "WebSearch",
  description: "Search the web for information",
});

export { akaveStorage, leadQualification };
