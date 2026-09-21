# Run this after you have your IAM Identity Center start URL.
# Example start URL: https://d-xxxxxxxxxx.awsapps.com/start

param(
  [Parameter(Mandatory = $true)]
  [string]$StartUrl,

  [string]$SsoRegion = "ap-southeast-2",
  [string]$ProfileName = "playground"
)

$aws = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$configDir = Join-Path $env:USERPROFILE ".aws"
$configPath = Join-Path $configDir "config"

New-Item -ItemType Directory -Force -Path $configDir | Out-Null

$block = @"

[profile $ProfileName]
sso_session = $ProfileName
region = $SsoRegion
output = json

[sso-session $ProfileName]
sso_start_url = $StartUrl
sso_region = $SsoRegion
sso_registration_scopes = sso:account:access
"@

if (Test-Path $configPath) {
  $existing = Get-Content $configPath -Raw
  if ($existing -match "\[profile $ProfileName\]") {
    Write-Host "Profile '$ProfileName' already exists in $configPath"
  } else {
    Add-Content -Path $configPath -Value $block
    Write-Host "Added profile '$ProfileName'"
  }
} else {
  Set-Content -Path $configPath -Value $block.TrimStart()
  Write-Host "Created $configPath"
}

Write-Host ""
Write-Host "Next: browser login will open. Pick your account + role when asked."
Write-Host ""

& $aws sso login --sso-session $ProfileName
if ($LASTEXITCODE -ne 0) {
  Write-Host "SSO login failed."
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Available accounts/roles:"
& $aws configure sso-session --help 2>$null | Out-Null
& $aws sso list-accounts --profile $ProfileName 2>&1

Write-Host ""
Write-Host "If list-accounts fails, finish role setup with:"
Write-Host "  & '$aws' configure sso --profile $ProfileName"
Write-Host ""
Write-Host "Then verify:"
Write-Host "  & '$aws' sts get-caller-identity --profile $ProfileName"
