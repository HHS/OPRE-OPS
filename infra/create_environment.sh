#!/bin/bash
set -eo pipefail

SPACE=sandbox
DB_NAME=ops-db
BACKEND=ops-backend
FRONTEND=ops-frontend
DATA_TOOLS=ops-data-tools

cf target -o "$ORG" -s $SPACE

# echo "Creating RDS Service..."
# cf create-service aws-rds micro-psql $DB_NAME -c '{"version":"12"}' -t $SPACE

# echo "Creating App Definitions..."
# cf create-app $BACKEND --app-type buildpack
# cf create-app $FRONTEND --app-type buildpack
# cf create-app $DATA_TOOLS --app-type buildpack

# echo "Create/Map Routes..."
# cf map-route ops-backend app.cloud.gov --hostname ops-api-$SPACE
# cf map-route ops-frontend app.cloud.gov --hostname ops-$SPACE

echo "Binding DB to Apps..."
cf bind-service $BACKEND $DB_NAME
cf bind-service $DATA_TOOLS $DB_NAME

echo "Updating Security Groups..."
cf bind-security-group trusted_local_networks "$ORG" --space $SPACE
cf bind-security-group public_networks "$ORG" --space $SPACE

echo "Environment is now setup. Optionally, you may now deploy your apps via:"
echo "   cf push <app-name> -f manifest.yml"
echo "     or..."
echo "   cf push <app-name> --docker-image REP/IMAGE:TAG"
