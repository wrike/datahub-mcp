#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatahubClient } from "./datahub_client.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import 'dotenv/config'
import { DatahubTool, tools } from "./tools.js";

// Server implementation
async function main() {
  const token = process.env.WRIKE_TOKEN;
  const host = process.env.WRIKE_HOST || 'www.wrike.com';

  if (!token) {
    console.error("Please set WRIKE_TOKEN environment variable");
    process.exit(1);
  }

  console.error("Starting Wrike DataHub MCP Server...");
  const server = new Server(
    {
      name: "Wrike DataHub MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  const datahubClient = new DatahubClient(token, host);

  const toolByName = tools.reduce((map, tool) => {
    map[tool.name] = tool
    return map
  }, {} as Record<string, DatahubTool>);

  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const tool = toolByName[request.params.name]
        if (tool) {
          const params = request.params.arguments
          const result = await tool.handler(params, datahubClient)
          return {
            content: [{type: "text", text: JSON.stringify(result)}]
          }
        } else {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
  );

  // Handle tools listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: tools,
    };
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Wrike DataHub MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});