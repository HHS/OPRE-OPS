# Cloud.gov (Cloud Foundry) Setup

## Create App
`cf create-app** APP_NAME [--app-type (buildpack | docker)]`


## Create DB
`cf create-service** SERVICE_OFFERING PLAN SERVICE_INSTANCE [-b SERVICE_BROKER] [-c PARAMETERS_AS_JSON] [-t TAGS]`


### example:
`cf create-service aws-rds micro-psql ops-db -c '{"version":"12"}' -t dev`

## Bind Service (DB)
`cf bind-service <app-name> <service-name>`

### example:
`cf bind-service ops-backend ops-db`

#### Create Service Account & Credentials
[https://cloud.gov/docs/services/cloud-gov-service-account/](https://cloud.gov/docs/services/cloud-gov-service-account/)

## create service account
`cf create-service cloud-gov-service-account [ space-deployer | space-auditor ] <svc-acct-name>`

## get credentials
`cf create-service-key <svc-acct-name> <svc-key-name>`
`cf service-key <svc-acct-name> <svc-key-name>`


### example:
`cf create-service cloud-gov-service-account space-deployer gha-deployment`
`cf create-service-key gha-deployment gha-deployment-key`
`cf service-key gha-deployment gha-deployment-key`

#### output:
```
{
    "password": "oYasdfliaweinasfdliecV",
 	"username": "deadbeed-aabb-1234-feha0987654321000"
}
```

## Allow App to connect to DB
### Assign the trusted_local_networks_egress Application Security Group
`cf bind-security-group SECURITY_GROUP ORG [SPACE] [--lifecycle (running | staging)]`
`cf bind-security-group public_networks_egress sandbox-gsa --space SPACE`


### example:
`cf bind-security-group trusted_local_networks acf-opre-prototyping --space staging`
`cf bind-security-group public_networks acf-opre-prototyping --space staging`


## Execute a Task
`cf run-task <app-name> --name <task-name> --command <command-to-run>

### example:
Run the command `./scripts/import_data.sh` within the `ops-data-tools` app.
`cf run-task ops-data-tools --command "ENV=cloudgov ./scripts/import_data.sh" --name load_sample_data`




## Creating a new deployment:
```bash
#!/bin/bash
set -eo pipefail

SPACE=dev
DB_NAME=ops-db
BACKEND=ops-backend
FRONTEND=ops-frontend
DATA_TOOLS=ops-data-tools

cf target -o $ORG -s $SPACE

echo "Creating RDS Service..."
cf create-service aws-rds micro-psql $DB_NAME -c '{"version":"12"}' -t $SPACE

echo "Creating App Definitions..."
cf create-app $BACKEND --app-type buildpack
cf create-app $FRONTEND --app-type buildpack
cf create-app $DATA_TOOLS --app-type buildpack

echo "Create/Map Routes..."
cf map-route ops-backend app.cloud.gov --hostname ops-api-$SPACE
cf map-route ops-frontend app.cloud.gov --hostname ops-$SPACE

echo "Binding DB to Apps..."
cf bind-service $BACKEND $DB_NAME
cf bind-service $DATA_TOOLS $DB_NAME

echo "Updating Security Groups..."
cf bind-security-group trusted_local_networks $ORG --space $SPACE
cf bind-security-group public_networks $ORG --space $SPACE

echo "Environment is now setup. Optionally, you may now deploy your apps via:"
echo "   cf push <app-name> -f manifest.yml"
```
