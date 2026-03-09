#!/usr/bin/env bash
# Starts both the Express server and Vite dev server together.
# Ctrl+C kills both.

trap 'kill 0' INT TERM

echo "🚀 Starting server on :4000 ..."
(cd server && node src/app.js) &

echo "⚡ Starting client on :5173 ..."
(cd client && ./node_modules/.bin/vite) &

wait
