#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${FRONTEND_DIR}"

PARALLEL_JOBS="${CYPRESS_PARALLEL_JOBS:-4}"
CYPRESS_CONFIG_FILE="${CYPRESS_CONFIG_FILE:-./cypress.config.ci.js}"
SPEC_GLOB="${CYPRESS_SPEC_GLOB:-cypress/e2e/*.cy.js}"

if ! [[ "${PARALLEL_JOBS}" =~ ^[0-9]+$ ]] || [[ "${PARALLEL_JOBS}" -lt 1 ]]; then
    echo "CYPRESS_PARALLEL_JOBS must be a positive integer. Got: ${PARALLEL_JOBS}" >&2
    exit 1
fi

SPECS=()
while IFS= read -r spec; do
    SPECS+=("${spec}")
done < <(find cypress/e2e -maxdepth 1 -type f -name "*.cy.js" | sort)

if [[ "${SPEC_GLOB}" != "cypress/e2e/*.cy.js" ]]; then
    if [[ "${SPEC_GLOB}" != *"/"* ]]; then
        SPEC_GLOB="*${SPEC_GLOB}*"
    fi

    FILTERED_SPECS=()
    for spec in "${SPECS[@]}"; do
        if [[ "${spec}" == ${SPEC_GLOB} ]]; then
            FILTERED_SPECS+=("${spec}")
        fi
    done
    SPECS=("${FILTERED_SPECS[@]}")
fi

if [[ "${#SPECS[@]}" -eq 0 ]]; then
    echo "No Cypress specs matched pattern: ${SPEC_GLOB}" >&2
    exit 1
fi

echo "Running ${#SPECS[@]} Cypress specs with ${PARALLEL_JOBS} parallel workers"
echo "Config file: ${CYPRESS_CONFIG_FILE}"

export CYPRESS_CONFIG_FILE
printf "%s\n" "${SPECS[@]}" | xargs -I{} -P "${PARALLEL_JOBS}" -n 1 bash -lc '
    spec="$1"
    echo "[$(date +%H:%M:%S)] START ${spec}"
    cypress run --config-file "${CYPRESS_CONFIG_FILE}" --headless --spec "${spec}"
' _ {}
