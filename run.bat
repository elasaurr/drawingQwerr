@echo off
echo cls

echo Starting Backend...
start cmd /k "cd backend && npm run dev"

echo Starting Frontend...
start cmd /k "npm run dev"

echo Both servers started!
pause
