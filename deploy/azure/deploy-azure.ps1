<#
.SYNOPSIS
  Deploys Athletiqa to Azure Container Apps + Azure SQL (free offer). Safe to re-run: it updates what exists.

.DESCRIPTION
  Creates (or updates):
    - Resource group
    - Azure Container Registry (Basic) and builds both images in the cloud (no local Docker needed)
    - Azure SQL logical server + serverless database using the free offer (auto-pauses when the free limit is hit)
    - Container Apps environment (Consumption, no Log Analytics)
    - athletiqa-mail : Mailpit (web UI public behind basic auth, SMTP internal only)
    - athletiqa-migrate : manual job that runs `dotnet backend.dll --migrate`
    - athletiqa-api  : .NET backend, internal ingress only
    - athletiqa-web  : nginx frontend, public, reverse-proxies /api and /hubs to athletiqa-api

  Optional secrets are read from environment variables if set:
    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  They can also be set later with: az containerapp secret set -g <rg> -n athletiqa-api --secrets stripe-key=...

.EXAMPLE
  ./deploy/azure/deploy-azure.ps1 -Location swedencentral
#>
param(
    [string]$Location = "swedencentral",
    [string]$ResourceGroup = "athletiqa-rg",
    [string]$ImageTag = (Get-Date -Format "yyyyMMddHHmmss"),
    [switch]$SkipBuild,
    # CI mode: only build images, run migrations and roll out new images. Infra and secrets must already exist.
    [switch]$UpdateImagesOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$localDir = Join-Path $PSScriptRoot ".local"   # gitignored: holds the generated SQL admin password
New-Item -ItemType Directory -Force $localDir | Out-Null

function Invoke-Az {
    # Runs az and throws on failure so the script stops at the first error
    $out = & az @args
    if ($LASTEXITCODE -ne 0) { throw "az $($args -join ' ') failed (exit $LASTEXITCODE)" }
    return $out
}
function Test-AzResource { & az @args 2>$null | Out-Null; return ($LASTEXITCODE -eq 0) }
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Invoke-MigrationJob($jobName, $rg) {
    $execName = Invoke-Az containerapp job start -n $jobName -g $rg --query name -o tsv
    Write-Host "Started $execName, waiting for it to finish (the free DB may need a minute to resume)..."
    do {
        Start-Sleep 15
        $status = Invoke-Az containerapp job execution show -n $jobName -g $rg --job-execution-name $execName --query properties.status -o tsv
        Write-Host "  status: $status"
    } while ($status -in @("Running", "Processing", ""))
    if ($status -ne "Succeeded") { throw "Migration job ended with status '$status'. Logs: az containerapp job logs show -n $jobName -g $rg --execution $execName --container $jobName" }
}

az config set extension.use_dynamic_install=yes_without_prompt --only-show-errors 2>$null | Out-Null
az config set core.only_show_errors=true 2>$null | Out-Null

$subId = Invoke-Az account show --query id -o tsv
$suffix = $subId.Substring(0, 6)                       # keeps globally-unique names stable per subscription
$acrName   = "athletiqaacr$suffix"
$sqlServer = "athletiqa-sql-$suffix"
$sqlDb     = "AthletiqaDb"
$sqlAdmin  = "athletiqaadmin"
$envName   = "athletiqa-env"
$apiApp    = "athletiqa-api"
$webApp    = "athletiqa-web"
$mailApp   = "athletiqa-mail"
$jobName   = "athletiqa-migrate"

if (-not $UpdateImagesOnly) {
    Step "Registering resource providers (first run can take a few minutes)"
    foreach ($ns in "Microsoft.App", "Microsoft.ContainerRegistry", "Microsoft.Sql", "Microsoft.OperationalInsights") {
        Invoke-Az provider register --namespace $ns --wait | Out-Null
    }

    Step "Resource group $ResourceGroup in $Location"
    Invoke-Az group create -n $ResourceGroup -l $Location -o none

    Step "Container registry $acrName"
    if (-not (Test-AzResource acr show -n $acrName -g $ResourceGroup)) {
        Invoke-Az acr create -n $acrName -g $ResourceGroup --sku Basic --admin-enabled true -o none
    }
}
$acrServer = Invoke-Az acr show -n $acrName --query loginServer -o tsv
$acrUser   = Invoke-Az acr credential show -n $acrName --query username -o tsv
$acrPass   = Invoke-Az acr credential show -n $acrName --query "passwords[0].value" -o tsv
$apiImage  = "$acrServer/athletiqa/backend:$ImageTag"
$webImage  = "$acrServer/athletiqa/frontend:$ImageTag"

if ($SkipBuild) {
    $ImageTag = Invoke-Az acr repository show-tags -n $acrName --repository athletiqa/backend --orderby time_desc --top 1 -o tsv
    $apiImage = "$acrServer/athletiqa/backend:$ImageTag"
    $webImage = "$acrServer/athletiqa/frontend:$ImageTag"
    Write-Host "Skipping build, reusing tag $ImageTag"
} else {
    Step "Building images in ACR (tag $ImageTag)"
    Invoke-Az acr build -r $acrName -t "athletiqa/backend:$ImageTag" -f backend/Dockerfile $repoRoot --no-logs -o none
    # VITE_API_URL empty => the SPA calls /api on its own origin, which nginx proxies to the backend
    Invoke-Az acr build -r $acrName -t "athletiqa/frontend:$ImageTag" -f frontend/Dockerfile --build-arg VITE_API_URL= $repoRoot --no-logs -o none
}

if ($UpdateImagesOnly) {
    Step "Running migrations with $apiImage"
    Invoke-Az containerapp job update -n $jobName -g $ResourceGroup --image $apiImage -o none
    Invoke-MigrationJob $jobName $ResourceGroup
    Step "Rolling out new images"
    Invoke-Az containerapp update -n $apiApp -g $ResourceGroup --image $apiImage --set-env-vars "IMAGE_TAG=$ImageTag" -o none
    Invoke-Az containerapp update -n $webApp -g $ResourceGroup --image $webImage -o none
    $fqdn = Invoke-Az containerapp show -n $webApp -g $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
    Write-Host "`nDeployed $ImageTag -> https://$fqdn" -ForegroundColor Green
    return
}

Step "Azure SQL server $sqlServer + free serverless database"
$pwFile = Join-Path $localDir "sql-admin-password.txt"
if (Test-Path $pwFile) {
    $sqlPassword = (Get-Content $pwFile -Raw).Trim()
} else {
    $chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    $sqlPassword = 'Aq9!' + (-join (1..28 | ForEach-Object { $chars | Get-Random }))
    Set-Content -Path $pwFile -Value $sqlPassword -NoNewline
}
if (-not (Test-AzResource sql server show -n $sqlServer -g $ResourceGroup)) {
    Invoke-Az sql server create -n $sqlServer -g $ResourceGroup -l $Location -u $sqlAdmin -p $sqlPassword -o none
}
# 0.0.0.0 - 0.0.0.0 = "Allow Azure services", needed because Consumption Container Apps have no fixed outbound IP
if (-not (Test-AzResource sql server firewall-rule show -g $ResourceGroup -s $sqlServer -n AllowAzureServices)) {
    Invoke-Az sql server firewall-rule create -g $ResourceGroup -s $sqlServer -n AllowAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 -o none
}
if (-not (Test-AzResource sql db show -g $ResourceGroup -s $sqlServer -n $sqlDb)) {
    Invoke-Az sql db create -g $ResourceGroup -s $sqlServer -n $sqlDb `
        -e GeneralPurpose -f Gen5 -c 2 --compute-model Serverless `
        --use-free-limit --free-limit-exhaustion-behavior AutoPause -o none
}
$connString = "Server=tcp:$sqlServer.database.windows.net,1433;Database=$sqlDb;User ID=$sqlAdmin;Password=$sqlPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=60;"

Step "Container Apps environment $envName"
if (-not (Test-AzResource containerapp env show -n $envName -g $ResourceGroup)) {
    Invoke-Az containerapp env create -n $envName -g $ResourceGroup -l $Location --logs-destination none -o none
}
$envId     = Invoke-Az containerapp env show -n $envName -g $ResourceGroup --query id -o tsv
$envDomain = Invoke-Az containerapp env show -n $envName -g $ResourceGroup --query properties.defaultDomain -o tsv
$frontendUrl = "https://$webApp.$envDomain"

Step "Mailpit ($mailApp)"
$mailPwFile = Join-Path $localDir "mailpit-ui-password.txt"
if (-not (Test-Path $mailPwFile)) {
    Set-Content -Path $mailPwFile -NoNewline -Value (-join ((48..57) + (97..122) | Get-Random -Count 20 | ForEach-Object { [char]$_ }))
}
$mailPw = (Get-Content $mailPwFile -Raw).Trim()
# YAML is needed because the CLI flags can't declare the extra internal SMTP port
$mailYaml = Join-Path $localDir "mailpit.yaml"
@"
location: $Location
properties:
  environmentId: $envId
  configuration:
    secrets:
      - name: ui-auth
        value: "admin:$mailPw"
    ingress:
      external: true
      targetPort: 8025
      transport: http
      additionalPortMappings:
        - external: false
          targetPort: 1025
          exposedPort: 1025
  template:
    containers:
      - name: mailpit
        image: docker.io/axllent/mailpit:latest
        resources: { cpu: 0.25, memory: 0.5Gi }
        env:
          - name: MP_UI_AUTH
            secretRef: ui-auth
          - name: MP_SMTP_AUTH_ACCEPT_ANY
            value: "true"
          - name: MP_SMTP_AUTH_ALLOW_INSECURE
            value: "true"
    scale: { minReplicas: 1, maxReplicas: 1 }
"@ | Set-Content -Path $mailYaml
if (Test-AzResource containerapp show -n $mailApp -g $ResourceGroup) {
    Invoke-Az containerapp update -n $mailApp -g $ResourceGroup --yaml $mailYaml -o none
} else {
    Invoke-Az containerapp create -n $mailApp -g $ResourceGroup --yaml $mailYaml -o none
}

# Shared backend secrets + env vars (used by both the migration job and the API)
$secrets = @(
    "db-conn=$connString",
    "stripe-key=$(if ($env:STRIPE_SECRET_KEY) { $env:STRIPE_SECRET_KEY } else { 'not-set' })",
    "stripe-webhook=$(if ($env:STRIPE_WEBHOOK_SECRET) { $env:STRIPE_WEBHOOK_SECRET } else { 'not-set' })",
    "cloudinary-name=$(if ($env:CLOUDINARY_CLOUD_NAME) { $env:CLOUDINARY_CLOUD_NAME } else { 'not-set' })",
    "cloudinary-key=$(if ($env:CLOUDINARY_API_KEY) { $env:CLOUDINARY_API_KEY } else { 'not-set' })",
    "cloudinary-secret=$(if ($env:CLOUDINARY_API_SECRET) { $env:CLOUDINARY_API_SECRET } else { 'not-set' })"
)
$envVars = @(
    "ASPNETCORE_ENVIRONMENT=Production",
    "ASPNETCORE_URLS=http://+:8080",
    "IMAGE_TAG=$ImageTag",
    "ConnectionStrings__DefaultConnection=secretref:db-conn",
    "EmailSettings__Host=$mailApp",
    "EmailSettings__Port=1025",
    "Stripe__SecretKey=secretref:stripe-key",
    "Stripe__WebhookSecret=secretref:stripe-webhook",
    "Cloudinary__CloudName=secretref:cloudinary-name",
    "Cloudinary__ApiKey=secretref:cloudinary-key",
    "Cloudinary__ApiSecret=secretref:cloudinary-secret",
    "Cloudinary__RootFolder=athletiqa/azure",
    "FrontendUrl=$frontendUrl",
    "AllowedOrigins=$frontendUrl"
)

Step "Database migrations job ($jobName)"
if (Test-AzResource containerapp job show -n $jobName -g $ResourceGroup) {
    Invoke-Az containerapp job secret set -n $jobName -g $ResourceGroup --secrets @secrets -o none
    Invoke-Az containerapp job update -n $jobName -g $ResourceGroup --image $apiImage --set-env-vars @envVars -o none
} else {
    Invoke-Az containerapp job create -n $jobName -g $ResourceGroup --environment $envName `
        --trigger-type Manual --replica-timeout 1200 --replica-retry-limit 1 --parallelism 1 --replica-completion-count 1 `
        --image $apiImage --args "--migrate" --cpu 0.5 --memory 1Gi `
        --registry-server $acrServer --registry-username $acrUser --registry-password $acrPass `
        --secrets @secrets --env-vars @envVars -o none
}
Invoke-MigrationJob $jobName $ResourceGroup

Step "Backend ($apiApp, internal only)"
if (Test-AzResource containerapp show -n $apiApp -g $ResourceGroup) {
    Invoke-Az containerapp secret set -n $apiApp -g $ResourceGroup --secrets @secrets -o none
    Invoke-Az containerapp update -n $apiApp -g $ResourceGroup --image $apiImage --set-env-vars @envVars -o none
} else {
    # maxReplicas 1: SignalR has no backplane configured, so connections must land on one instance
    Invoke-Az containerapp create -n $apiApp -g $ResourceGroup --environment $envName `
        --image $apiImage --target-port 8080 --ingress internal --transport http `
        --cpu 0.5 --memory 1Gi --min-replicas 0 --max-replicas 1 `
        --registry-server $acrServer --registry-username $acrUser --registry-password $acrPass `
        --secrets @secrets --env-vars @envVars -o none
}

Step "Frontend ($webApp, public)"
if (Test-AzResource containerapp show -n $webApp -g $ResourceGroup) {
    Invoke-Az containerapp update -n $webApp -g $ResourceGroup --image $webImage --set-env-vars "BACKEND_URL=http://$apiApp" -o none
} else {
    Invoke-Az containerapp create -n $webApp -g $ResourceGroup --environment $envName `
        --image $webImage --target-port 5173 --ingress external --transport http `
        --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 1 `
        --registry-server $acrServer --registry-username $acrUser --registry-password $acrPass `
        --env-vars "BACKEND_URL=http://$apiApp" -o none
}

$mailFqdn = Invoke-Az containerapp show -n $mailApp -g $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
Write-Host "`nDone." -ForegroundColor Green
Write-Host "  App:      $frontendUrl"
Write-Host "  Mailpit:  https://$mailFqdn  (user: admin, password in deploy/azure/.local/mailpit-ui-password.txt)"
Write-Host "  SQL admin password: deploy/azure/.local/sql-admin-password.txt"
