# Stop and remove Redis test container using Podman
Write-Host "Stopping Redis test container with Podman..."

# Use podman-compose if available, otherwise use podman compose
if (Get-Command podman-compose -ErrorAction SilentlyContinue) {
    podman-compose down -v
} else {
    podman compose down -v
}

Write-Host "✅ Redis container stopped"