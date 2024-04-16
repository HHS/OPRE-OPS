const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const core = require('@actions/core');

// Retrieve inputs
const configType = core.getInput('config_type') || 'package.json';
const configFileDir = core.getInput('config_dir') || '';
const versionType = core.getInput('version-type') || core.getInput('default') || 'patch';
const tagPrefix = core.getInput('tag-prefix') || '';
const tagSuffix = core.getInput('tag-suffix') || '';
const customGitDomain = core.getInput('custom-git-domain') || 'github.com';
const commitMessage = core.getInput('commit-message') || 'ci: version bump to {{version}}';
const skipTag = core.getInput('skip-tag') === 'true';
const skipCommit = core.getInput('skip-commit') === 'true';
const skipPush = core.getInput('skip-push') === 'true';
const targetBranch = core.getInput('target-branch');

const workspacePath = path.join(process.env.GITHUB_WORKSPACE, configFileDir);
const configFilePath = path.join(workspacePath, configType);

function readConfig() {
  if (!fs.existsSync(configFilePath)) throw new Error(`Configuration file not found: ${configFilePath}`);
  const content = fs.readFileSync(configFilePath, 'utf8');
  return configType.endsWith('.json') ? JSON.parse(content) : yaml.load(content);
}

function writeConfig(config) {
  const content = configType.endsWith('.json') ? JSON.stringify(config, null, 2) : yaml.dump(config);
  fs.writeFileSync(configFilePath, content, 'utf8');
}

function getCurrentVersion(config) {
  return configType === 'package.json' ? config.version : config.info.version;
}

function bumpVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  switch (versionType) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Unsupported version type: ${versionType}`);
  }
}

function gitCommands(version) {
  const fullVersion = `${tagPrefix}${version}${tagSuffix}`;
  const formattedCommitMessage = commitMessage.replace('{{version}}', fullVersion);
  execSync('git config user.name "GitHub Actions"');
  execSync('git config user.email "actions@github.com"');
  execSync(`git add ${configFilePath}`);
  if (!skipCommit) execSync(`git commit -m "${formattedCommitMessage}"`);
  if (!skipTag) execSync(`git tag "${fullVersion}"`);
  if (!skipPush) {
    const remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@${customGitDomain}/${process.env.GITHUB_REPOSITORY}.git`;
    execSync(`git push "${remoteRepo}" ${targetBranch ? targetBranch : '--all'} --follow-tags`);
  }
}

function main() {
  try {
    const config = readConfig();
    const currentVersion = getCurrentVersion(config);
    const newVersion = bumpVersion(currentVersion);
    configType === 'package.json' ? config.version = newVersion : config.info.version = newVersion;
    writeConfig(config);
    gitCommands(newVersion);
    core.setOutput("newTag", newVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
