# Script to start both frontend and backend servers
Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-Command", "cd .\flashcard-backend; node server.js"

Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-Command", "npm run dev"

Write-Host "Servers are starting. Check the new PowerShell windows for output."
Write-Host "Frontend: http://localhost:3001"
Write-Host "Backend: http://localhost:3000"
