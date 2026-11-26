# Deploying Athletiqa to Azure

## What gets created

All of it goes in one resource group (`athletiqa-rg`), so deleting that group removes everything.

| Resource | Name | Notes |
| --- | --- | --- |
| Container Registry (Basic) | `athletiqaacr<sub-id-prefix>` | Images are built in Azure with `az acr build` (no local Docker). About $5/month. |
| Azure SQL server + DB | `athletiqa-sql-<sub-id-prefix>` / `AthletiqaDb` | Serverless, **free offer** (100k vCore-seconds + 32 GB per month). Auto-pauses when the free limit is used up, so it never bills. |
| Container Apps environment | `athletiqa-env` | Consumption plan, no Log Analytics |
| Container App | `athletiqa-web` | Public. nginx + React, proxies `/api` and `/hubs` to the API |
| Container App | `athletiqa-api` | Internal only, scales to zero |
| Container App | `athletiqa-mail` | Mailpit. UI is public behind basic auth (user `admin`); SMTP is internal only |
| Container Apps Job | `athletiqa-migrate` | Runs `dotnet backend.dll --migrate` |

## First deployment (from your machine)

1. Sign in: `az login` (pick the subscription with Azure for Students).
2. Optional: export Stripe and Cloudinary keys in the same shell. If you skip them, the app still runs, but payments and uploads fail until you set them.
   ```powershell
   $env:STRIPE_SECRET_KEY = "sk_test_..."; $env:STRIPE_WEBHOOK_SECRET = "whsec_..."
   $env:CLOUDINARY_CLOUD_NAME = "..."; $env:CLOUDINARY_API_KEY = "..."; $env:CLOUDINARY_API_SECRET = "..."
   ```
3. Run the script (Azure for Students only allows some regions; if `swedencentral` is refused, try `northeurope` or `westeurope`):
   ```powershell
   ./deploy/azure/deploy-azure.ps1 -Location swedencentral
   ```
   It prints the app URL and the Mailpit URL. Generated passwords are saved in `deploy/azure/.local/`, which is gitignored.

Re-running the script is safe. It updates existing resources and redeploys.

## Setting secrets later

```powershell
az containerapp secret set -g athletiqa-rg -n athletiqa-api --secrets stripe-key=sk_test_... stripe-webhook=whsec_...
az containerapp revision restart -g athletiqa-rg -n athletiqa-api --revision (az containerapp show -g athletiqa-rg -n athletiqa-api --query properties.latestRevisionName -o tsv)
```

Secret names: `db-conn`, `stripe-key`, `stripe-webhook`, `cloudinary-name`, `cloudinary-key`, `cloudinary-secret`.

For the Stripe webhook, point it at `https://<app-url>/api/...` (the webhook route under `backend/Features/Stripe/StripeWebhook`).

## CI/CD with GitHub Actions

`.github/workflows/deploy-azure.yml` deploys on every push to `main`, using OIDC so no Azure password is stored in GitHub. One-time setup, after the first deployment:

```powershell
$sub = az account show --query id -o tsv
$tenant = az account show --query tenantId -o tsv
$appId = az ad app create --display-name athletiqa-github --query appId -o tsv
az ad sp create --id $appId | Out-Null
az role assignment create --assignee $appId --role Contributor --scope "/subscriptions/$sub/resourceGroups/athletiqa-rg"
az ad app federated-credential create --id $appId --parameters '{\"name\":\"github-main\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:GitUser4179/Athletiqa:environment:production\",\"audiences\":[\"api://AzureADTokenExchange\"]}'
gh secret set AZURE_CLIENT_ID --body $appId
gh secret set AZURE_TENANT_ID --body $tenant
gh secret set AZURE_SUBSCRIPTION_ID --body $sub
```

If `az ad app create` is refused, your Students tenant doesn't let you register apps. Deploy manually with the script instead.

## Tearing it down

```powershell
az group delete -n athletiqa-rg
```
