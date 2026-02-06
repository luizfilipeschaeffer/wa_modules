# Helper script to run docker-compose from docker/ directory
# Usage: .\docker-compose.ps1 up -d

$dockerDir = Join-Path $PSScriptRoot "docker"
Set-Location $dockerDir
docker-compose $args
