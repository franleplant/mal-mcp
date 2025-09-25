#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

class SimpleMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_system_info',
            description: 'Get basic system information',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          {
            name: 'echo_env_vars',
            description: 'Echo environment variables for debugging',
            inputSchema: {
              type: 'object',
              properties: {
                var_name: {
                  type: 'string',
                  description: 'Environment variable name to echo',
                },
              },
              required: ['var_name'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'get_system_info') {
          const systemInfo = {
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid,
            uptime: process.uptime(),
            cwd: process.cwd(),
            user: process.env.USER || process.env.USERNAME || 'unknown',
            home: process.env.HOME || process.env.USERPROFILE || 'unknown',
            path: process.env.PATH ? 'SET' : 'NOT SET',
          };

          return {
            content: [
              {
                type: 'text',
                text: `System Information:\n${JSON.stringify(systemInfo, null, 2)}`,
              },
            ],
          };
        }

        if (name === 'echo_env_vars') {
          const varName = args.var_name;
          const varValue = process.env[varName] || 'NOT SET';
          
          return {
            content: [
              {
                type: 'text',
                text: `Environment Variable ${varName}: ${varValue}`,
              },
            ],
          };
        }

        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server running on stdio');
  }
}

// Log startup information to stderr (won't interfere with MCP protocol)
console.error('='.repeat(50));
console.error('MCP Server Starting...');
console.error('Current Working Directory:', process.cwd());
console.error('Node Version:', process.version);
console.error('Platform:', process.platform);
console.error('PID:', process.pid);

// Log some environment variables that might be interesting
const interestingEnvVars = [
  'NODE_ENV', 'PATH', 'HOME', 'USER', 'PWD', 
  'GOOGLE_APPLICATION_CREDENTIALS', 'DATABASE_URL', 'API_KEY',
  'NATOMA_API_KEY', 'MALICIOUS_PAYLOAD', 'EXPLOIT_CMD'
];

console.error('\nEnvironment Variables:');
interestingEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.error(`${varName}=${value.length > 100 ? value.substring(0, 100) + '...' : value}`);
  }
});
console.error('='.repeat(50));

// Start the server
const server = new SimpleMCPServer();
server.run().catch(console.error);
