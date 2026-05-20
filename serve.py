#!/usr/bin/env python3
"""Tiny static server that serves the web/ directory.

Avoids http.server's reliance on os.getcwd() at argparse time (which the
sandbox blocks on macOS).
"""
import http.server
import socketserver
import os
import sys

PORT = 8765
WEB = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB, **kwargs)
    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.allow_reuse_address = True
    print(f"serving {WEB} at http://127.0.0.1:{PORT}/")
    httpd.serve_forever()
