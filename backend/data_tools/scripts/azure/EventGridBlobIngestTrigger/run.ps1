# Input bindings are passed in via param block.
param([byte[]] $InputBlob, $TriggerMetadata)

# Write out the blob name and size to the information log.
Write-Host "PowerShell Blob trigger function Processed blob! Name: $($TriggerMetadata.Name) Size: $($InputBlob.Length) bytes"
az containerapp job start --name "opre-ops-dev-app-blis-myltest" --resource-group "opre-ops-dev-app-rg" --cpu 0.5 --memory "1Gi" --image ghcr.io/hhs/opre-ops/ops-data-tools:unstable --command "/bin/sh" "./data_tools/src/load_data.sh" --args "dev" "budget_lines" $TriggerMetadata.Name
