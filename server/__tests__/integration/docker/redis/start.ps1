# Start Redis test container using Podman
Write-Host "Starting Redis test container with Podman..."

# Check if podman is available
if (!(Get-Command podman -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Podman not found. Please install Podman Desktop or Podman CLI."
    exit 1
}

# Use podman-compose if available, otherwise use podman compose
if (Get-Command podman-compose -ErrorAction SilentlyContinue) {
    podman-compose up -d
} else {
    podman compose up -d
}

# Wait for Redis to be ready
Write-Host "Waiting for Redis to be ready..."
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $result = podman exec redis-test-semaphore redis-cli -p 6380 ping 2>$null
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