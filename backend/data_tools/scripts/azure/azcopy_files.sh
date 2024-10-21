#!/bin/bash

FILE_PATH=$1
FILE_NAME=$2
STORAGE_ACCOUNT_NAME=$3

timestamp_plus_1_min=$(date -u -v +1M +"%Y-%m-%dT%H:%M:%SZ")

sas_token=$(az storage container generate-sas --account-name "${STORAGE_ACCOUNT_NAME}" --name data --permissions acdlrw --expiry "${timestamp_plus_1_min}" --auth-mode login --as-user)

destination_url="https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/data/${FILE_NAME}?${sas_token//\"/}"

azcopy copy "${FILE_PATH}/${FILE_NAME}" "${destination_url}" --overwrite=true
