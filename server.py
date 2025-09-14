#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from pathlib import Path

# Get the directory of this script
script_dir = Path(__file__).parent.absolute()
os.chdir(script_dir)  # Change to the github_pages directory

# Default port
PORT = 8000
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        print(f"Invalid port number: {sys.argv[1]}")
        sys.exit(1)

# Create a simple HTTP server
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
})

# Enable CORS for local development
class CORSHTTPRequestHandler(Handler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

print(f"Starting server at http://localhost:{PORT}")
print(f"Serving files from: {script_dir}")
print("Press Ctrl+C to stop the server")

# Start the server
with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
