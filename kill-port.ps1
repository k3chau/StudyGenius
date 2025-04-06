# PowerShell script to kill process using port 3001
$port=3001
$processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
if($processId) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if($process) {
        Write-Host "Killing process" $process.ProcessName "with ID" $processId "using port" $port
        Stop-Process -Id $processId -Force
        Write-Host "Process killed successfully"
    }
    else {
        Write-Host "No process found with ID" $processId
    }
}
else {
    Write-Host "No process found using port" $port
} 