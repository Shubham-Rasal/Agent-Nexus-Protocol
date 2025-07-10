import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({ name: "mcp-open-library", version: "1.0.0" });
server.tool("search_books", `
  Search for books on the Open Library API.
  `, {
    q: z.string(),
}, async ({ q }) => {
    const data = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=20`);
    const json = await data.json();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(json),
            },
        ],
    };
});
await server.connect(new StdioServerTransport());
// {
//     "mcpServers": {
//         "default-server": {
//             "command": "node",
//             "args": [
//                 "build/index.js"
//             ],
//             "env": {
//                 "HOME": "/Users/abhayjitsinghgulati",
//                 "LOGNAME": "abhayjitsinghgulati",
//                 "PATH": "/Users/abhayjitsinghgulati/.npm/_npx/5a9d879542beca3a/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/Agent-Nexus-Protocol/mcp-server/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/Agent-Nexus-Protocol/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/node_modules/.bin:/Users/abhayjitsinghgulati/node_modules/.bin:/Users/node_modules/.bin:/node_modules/.bin:/usr/local/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/Agent-Nexus-Protocol/mcp-server/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/Agent-Nexus-Protocol/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/Hackathon/node_modules/.bin:/Users/abhayjitsinghgulati/Desktop/node_modules/.bin:/Users/abhayjitsinghgulati/node_modules/.bin:/Users/node_modules/.bin:/node_modules/.bin:/usr/local/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/abhayjitsinghgulati/Library/Android/sdk/emulator:/Users/abhayjitsinghgulati/Library/Android/sdk/platform-tools:/Users/abhayjitsinghgulati/Library/Application Support/Code/User/globalStorage/github.copilot-chat/debugCommand:/Users/abhayjitsinghgulati/Library/Android/sdk/emulator:/Users/abhayjitsinghgulati/Library/Android/sdk/platform-tools",
//                 "SHELL": "/bin/zsh",
//                 "TERM": "xterm-256color",
//                 "USER": "abhayjitsinghgulati"
//             }
//         }
//     }
// }
