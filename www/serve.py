#!/usr/bin/env python3
"""
Simple HTTP server with COOP/COEP headers for SharedArrayBuffer support.

This is required for WASM multi-threading with Web Workers.

Usage:
  python serve.py
  # Then open http://localhost:8080
"""

import http.server
import socketserver

PORT = 8088

class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class COOPCOEPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required for SharedArrayBuffer (WASM threading)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        # Disable caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)

if __name__ == '__main__':
    with ReuseAddrTCPServer(("", PORT), COOPCOEPHandler) as httpd:
        print(f"Blake3 Benchmark Server")
        print(f"=======================")
        print(f"Serving at http://localhost:{PORT}")
        print(f"")
        print(f"COOP/COEP headers enabled for SharedArrayBuffer")
        print(f"Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
