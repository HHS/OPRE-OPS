# Claude Actions for OPRE-OPS

This directory contains reusable scripts that can be invoked by Claude Code or run manually to assist with development workflows.

## Available Actions

### 1. Monitor CI (`monitor-ci.sh`)

**Purpose**: Monitor a GitHub Actions workflow run until completion

**Usage**:
```bash
.claude/actions/monitor-ci.sh <run_id> [check_interval_seconds] [output_file]
```

**Examples**:
```bash
# Monitor with default 60s interval
.claude/actions/monitor-ci.sh 21633978658

# Monitor with 90s interval
.claude/actions/monitor-ci.sh 21633978658 90

# Monitor with custom output file
.claude/actions/monitor-ci.sh 21633978658 60 /tmp/my-monitor.log
```

**Features**:
- Polls GitHub Actions API at specified intervals
- Logs all status changes with timestamps
- Shows elapsed time for each check
- Automatically fetches E2E test results when complete
- Exits with code 0 when run completes successfully

**Output**:
Creates a log file with timestamped status updates. When the run completes, shows:
- Conclusion (success/failure)
- Total elapsed time
- E2E test results (for PR #4941)

---

### 2. Quick CI Status (`quick-ci-status.sh`)

**Purpose**: Instantly check the status of the latest CI run on a branch

**Usage**:
```bash
.claude/actions/quick-ci-status.sh [branch_name]
```

**Examples**:
```bash
# Check default branch (react-19-upgrade)
.claude/actions/quick-ci-status.sh

# Check specific branch
.claude/actions/quick-ci-status.sh main
```

**Features**:
- Shows latest run status and conclusion
- Displays elapsed time for in-progress runs
- Shows E2E test results if run completed
- Provides direct link to GitHub Actions run

**Example Output**:
```
=== CI Status for branch: react-19-upgrade ===
Time: Tue Feb  3 08:45:00 CST 2026

Run ID: 21634663420
Status: in_progress
⏳ Run still in progress...
Running for: 3 minutes

View run: https://github.com/HHS/OPRE-OPS/actions/runs/21634663420
```

---

## Usage with Claude Code

Claude Code can execute these scripts automatically when you ask about CI status or need to monitor test runs.

**Example prompts**:
- "Check the CI status"
- "Monitor the latest CI run"
- "What's the status of the E2E tests?"
- "Has the CI finished yet?"

Claude will automatically:
1. Identify the appropriate action script
2. Get the relevant run ID or branch name
3. Execute the script
4. Parse and explain the results

---

## Manual Usage

All scripts are executable and can be run directly:

```bash
cd /Users/fpigeon/Code/OPRE-OPS

# Check current status
./.claude/actions/quick-ci-status.sh

# Start monitoring (blocks until complete)
./.claude/actions/monitor-ci.sh 21634663420 90

# Run in background
./.claude/actions/monitor-ci.sh 21634663420 90 &
```

---

## Requirements

- **GitHub CLI (`gh`)**: Must be installed and authenticated
  ```bash
  gh auth login
  ```

- **jq**: JSON processor (usually pre-installed on Mac)
  ```bash
  brew install jq  # if needed
  ```

---

## Adding New Actions

To add a new action:

1. Create a new shell script in `.claude/actions/`
2. Make it executable: `chmod +x .claude/actions/your-action.sh`
3. Add usage documentation in the script header
4. Update this README with the new action
5. Commit to the repository

**Template**:
```bash
#!/bin/bash
# Claude Action: Your Action Name
# Usage: your-action.sh [args]
#
# Description of what this action does

set -euo pipefail

# Your script here
```

---

## History

These actions were created during the React 19 upgrade (PR #4941) to help monitor and fix failing E2E tests. They proved valuable for:

- Monitoring long-running CI jobs without manual checking
- Quickly assessing test status during iterative fixes
- Automating repetitive CI checking workflows

They're now available for any future CI debugging needs.

---

## Integration with CLAUDE.md

See the main `CLAUDE.md` file for how these actions integrate with the overall development workflow.
