# GitHub Actions Scripts

This directory contains utility scripts used by GitHub Actions workflows.

## detect-flaky-tests.sh

**Purpose**: Automatically detect flaky E2E tests by analyzing Cypress retry patterns.

**Description**:
This script parses Cypress output logs to identify tests that initially failed but passed on a subsequent retry. Such tests are considered "flaky" because they exhibit non-deterministic behavior.

**Usage**:
```bash
.github/scripts/detect-flaky-tests.sh <cypress_output_file> [github_summary_file]
```

**Parameters**:
- `cypress_output_file` (required): Path to the Cypress output log file
- `github_summary_file` (optional): Path to write GitHub Actions job summary (typically `$GITHUB_STEP_SUMMARY`)

**Examples**:
```bash
# Basic usage - output to console only
.github/scripts/detect-flaky-tests.sh cypress-output.log

# CI usage - output to console and GitHub job summary
.github/scripts/detect-flaky-tests.sh cypress-output.log "$GITHUB_STEP_SUMMARY"
```

**How it works**:
1. Parses the Cypress output log file
2. Searches for patterns indicating test retries: `(Attempt 2 of 3)`, `(Attempt 3 of 3)`, etc.
3. Identifies spec files where retries occurred
4. Generates a formatted report with:
   - List of flaky test files
   - Explanation of what flakiness means
   - Recommended actions for fixing flaky tests
   - Guidance on tracking known flaky tests

**CI Integration**:
This script is automatically run by the E2E test workflow (`.github/workflows/e2e_test_reusable.yml`) after each Cypress test run. Results appear in:
- GitHub Actions job summary
- Console output during workflow execution

**Output Format**:
The script generates a Markdown report that includes:
- Status indicator (✅ no flaky tests or ⚠️ flaky tests detected)
- Table of affected spec files
- Guidance on investigating and fixing flaky tests
- Timestamp of detection

**Exit Codes**:
- `0`: Always exits successfully (warnings only, doesn't fail the build)
- Flaky tests are reported but don't cause build failures

**Local Usage**:
You can run this script locally to analyze Cypress output from local test runs:

```bash
# Run Cypress locally and capture output
cd frontend
npm run test:e2e 2>&1 | tee cypress-output.log

# Analyze for flaky tests
../.github/scripts/detect-flaky-tests.sh cypress-output.log
```

**Related Documentation**:
- See `.github/workflows/e2e_test_reusable.yml` for workflow integration
- See `frontend/cypress.config.ci.js` for retry configuration (currently 3 retries)
- See [Cypress Retry Documentation](https://docs.cypress.io/guides/guides/test-retries)

**Troubleshooting**:

*Q: The script reports "Cypress output file not found"*
A: Ensure Cypress output is being captured to a file using `tee` or output redirection.

*Q: No flaky tests detected but I know tests are retrying*
A: Check that the Cypress output includes retry information (configured via `retries` in cypress config).

*Q: False positives - tests marked as flaky but they're not*
A: The script looks for any retry attempts. Review the actual Cypress output to confirm the test behavior.

---

## Adding New Scripts

To add a new GitHub Actions script:

1. Create the script in `.github/scripts/`
2. Make it executable: `chmod +x .github/scripts/your-script.sh`
3. Add a header comment with usage documentation
4. Update this README with script documentation
5. Integrate into relevant workflow files
6. Test locally before committing

**Script Template**:
```bash
#!/bin/bash
# Brief description of what this script does
# Usage: script-name.sh <required_arg> [optional_arg]

set -euo pipefail

# Script implementation...
```
