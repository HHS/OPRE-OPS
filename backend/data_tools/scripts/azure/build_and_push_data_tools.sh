#!/bin/bash

REGISTRY_NAME=$1

az acr login --name "${REGISTRY_NAME}"

docker build -f Dockerfile.data-tools -t data-tools-test --platform linux/amd64 .

docker tag data-tools-test "${REGISTRY_NAME}".azurecr.io/data-tools-test:latest

docker push "${REGISTRY_NAME}".azurecr.io/data-tools-test:latest
