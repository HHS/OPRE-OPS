const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const semver = require('semver');
const { execSync } = require('child_process');
const core = require('@actions/core');

// Helper to read configuration file (JSON or YAML)
function readConfig(configPath) {
    const content = fs.readFileSync(configPath, 'utf8');
    return configPath.endsWith('.json') ? JSON.parse(content) : yaml.load(content);
}

// Helper to write configuration file (JSON or YAML)
function writeConfig(config, configPath) {
    const content = configPath.endsWith('.json') ? JSON.stringify(config, null, 2) : yaml.dump(config);
    fs.writeFileSync(configPath, content, 'utf8');
}

// Helper to get the current version from the configuration file
function getCurrentVersion(config, configType) {
    return configType === 'package.json' ? config.version : config.info.version;
}

// Helper to execute Git commands
function execGitCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        core.setFailed(`Execution failed for git command: ${command}. Error: ${error.message}`);
    }
}

// Determine version bump based on commit messages
function determineVersionBump(messages, majorWords, minorWords, patchWords, rcWords) {
    let bumpType = 'patch'; // default to patch

    if (messages.some(msg => rcWords.some(word => msg.includes(word)))) {
        bumpType = 'prerelease';
    } else if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        bumpType = 'major';
    } else if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        bumpType = 'minor';
    }

    return bumpType;
}

// Bump version based on the determined type
function bumpVersion(currentVersion, bumpType, preid = 'rc') {
    return semver.inc(currentVersion, bumpType, preid);
}

// Main function to orchestrate version bump and Git operations
function main() {
    const configType = core.getInput('config_type') || 'package.json';
    const configDir = core.getInput('config_dir') || '';
    const configPath = path.join(configDir, configType);

    const majorWords = core.getInput('major-wording').split(',');
    const minorWords = core.getInput('minor-wording').split(',');
    const patchWords = core.getInput('patch-wording').split(',');
    const rcWords = core.getInput('rc-wording').split(',');

    const skipTag = core.getInput('skip-tag') === 'true';
    const skipCommit = core.getInput('skip-commit') === 'true';
    const skipPush = core.getInput('skip-push') === 'true';

    const config = readConfig(configPath);
    const currentVersion = getCurrentVersion(config, configType);
    const commitMessages = execSync('git log --format=%B -n 20').toString().split('\n\n');
    const bumpType = determineVersionBump(commitMessages, majorWords, minorWords, patchWords, rcWords);
    const newVersion = bumpVersion(currentVersion, bumpType, 'rc');

    if (configType === 'package.json') {
        config.version = newVersion;
    } else {
        config.info.version = newVersion;
    }

    writeConfig(config, configPath);

    if (!skipCommit) {
        execGitCommand(`git add ${configPath}`);
        execGitCommand(`git commit -m "chore(version): bump to ${newVersion}"`);
    }

    if (!skipTag) {
        execGitCommand(`git tag v${newVersion}`);
    }

    if (!skipPush) {
        execGitCommand('git push');
        if (!skipTag) {
            execGitCommand('git push --tags');
        }
    }

    core.setOutput("newVersion", newVersion);
}

main();
