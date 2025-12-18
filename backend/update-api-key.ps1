# PowerShell script to update GOOGLE_API_KEY in .env file
$envFile = Join-Path $PSScriptRoot ".env"
$newApiKey = "AIzaSyABNifunE0rZiZ5uYxt8frAu0slo934ZgE"

if (Test-Path $envFile) {
    # Read the file
    $content = Get-Content $envFile
    
    # Replace or add GOOGLE_API_KEY
    $updated = $false
    $newContent = @()
    
    foreach ($line in $content) {
        if ($line -match "^GOOGLE_API_KEY=") {
            $newContent += "GOOGLE_API_KEY=$newApiKey"
            $updated = $true
        } else {
            $newContent += $line
        }
    }
    
    # If not found, add it
    if (-not $updated) {
        $newContent += "GOOGLE_API_KEY=$newApiKey"
    }
    
    # Write back
    $newContent | Set-Content $envFile
    Write-Host "✅ Updated GOOGLE_API_KEY in .env file" -ForegroundColor Green
} else {
    # Create new file
    "GOOGLE_API_KEY=$newApiKey" | Set-Content $envFile
    Write-Host "✅ Created .env file with GOOGLE_API_KEY" -ForegroundColor Green
}

Write-Host "`nPlease restart your server for changes to take effect." -ForegroundColor Yellow