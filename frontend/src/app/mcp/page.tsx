'use client';

import { useEffect, useState } from 'react';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export default function MCPPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    async function connect() {
      const transport = new StreamableHTTPClientTransport(
        new URL("")
      );

      const client = new Client({ name: "NextJS Client", version: "1.0.0" });
      await client.connect(transport);

      const toolsObj = await client.listTools();
      console.log("Available tools:", toolsObj);
      setTools(Object.values(toolsObj));

      const res = await client.callTool({
        name: "calculate",
        arguments: { expression: "3 * (5 + 3)" }
      });
      setResult(JSON.stringify(res));
    }

    connect().catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-2">MCP Calculator</h1>
      <p>Available tools: {tools.map(t => t.name).join(", ")}</p>
      <p className="mt-4">Calculation Result: {result}</p>
    </div>
  );
}

