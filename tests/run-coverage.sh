#!/bin/bash
# Generate coverage report with bb-mcp-server excluded

echo "Generating coverage..."
deno test --allow-all --unstable-kv --coverage=coverage

echo ""
echo "Coverage report (excluding bb-mcp-server):"
deno coverage coverage/ --exclude='file:///.*bb-mcp-server.*'

echo ""
echo "To generate HTML report, run:"
echo "  deno coverage coverage/ --html --exclude='file:///.*bb-mcp-server.*'"
