#!/bin/bash

docker build -f Dockerfile.data-tools -t data-tools-test --platform linux/amd64 .

docker tag data-tools-test opreopstest.azurecr.io/data-tools-test:latest

docker push opreopstest.azurecr.io/data-tools-test:latest
