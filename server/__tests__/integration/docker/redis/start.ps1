# Start Redis test container
Write-Host "Starting Redis test container..."
docker-compose up -d

# Wait for Redis to be ready
Write-Host "Waiting for Redis to be ready..."
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $result = docker exec redis-test-semaphore redis-cli -p 6380 ping 2>$null
    if ($result -eq "PONG") {
        Write-Host "✅ Redis is ready!"
        exit 0
    }
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..."
    Start-Sleep -Seconds 1
}

Write-Host "❌ Redis failed to start"
exit 1