# Test API endpoints

Write-Host "=== Fetching Subscription Types ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/admin/subscription-types" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Fetching Services ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/services" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Fetching Service Plans ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/admin/service-plans" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing POST /api/v1/admin/service-plans ===" -ForegroundColor Green
try {
    $body = @{
        service_id = "061c0df8-c1b1-4395-9c02-84d394545010"
        subscription_type_id = "02ddccaf-fe0a-48bd-9b43-503220616b59"
        price = 100
        age_group = "4-6"
        funding_type = "SELF"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/admin/service-plans" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
