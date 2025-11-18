# Stop and remove Redis test container
Write-Host "Stopping Redis test container..."
docker-compose down -v
Write-Host "✅ Redis container stopped"