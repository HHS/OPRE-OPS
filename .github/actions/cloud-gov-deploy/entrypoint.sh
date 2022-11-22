#!/bin/bash

set -e

CF_API=${INPUT_CF_API:-api.fr.cloud.gov}
CF_APP=${INPUT_CF_APP:-''}
# Authenticate and target CF org and space.
cf api "$CF_API"
cf auth "$INPUT_CF_USERNAME" "$INPUT_CF_PASSWORD"
cf target -o "$INPUT_CF_ORG" -s "$INPUT_CF_SPACE"

# If they specified a full command, run it
if [[ -n "$INPUT_COMMAND" ]]; then
  echo "Running command: $INPUT_COMMAND"
  eval $INPUT_COMMAND
  exit
fi

# If they specified a cf CLI subcommand, run it
if [[ -n "$INPUT_CF_COMMAND" ]]; then
  echo "Running command: $INPUT_CF_COMMAND"
  eval cf $INPUT_CF_COMMAND
  exit
fi

# Otherwise, assume they want to do a cf push.

# If they didn't specify and don't have a default-named manifest.yml, then the
# push will fail with a pretty accurate message: "Incorrect Usage: The specified
# path 'manifest.yml' does not exist."
MANIFEST=${INPUT_CF_MANIFEST:-manifest.yml}

# If they specified a vars file, use it
if [[ -r "$INPUT_CF_VARS_FILE" ]]; then
  echo "Pushing with vars file: $INPUT_CF_VARS_FILE"
  cf push "$CF_APP" -f "$MANIFEST" --vars-file "$INPUT_CF_VARS_FILE" --strategy rolling
else
  echo "Pushing with manifest file: $MANIFEST"
  cf push "$CF_APP" -f "$MANIFEST" --strategy rolling
fi
