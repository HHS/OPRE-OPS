const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { EOL } = require('os');
const path = require('path');
const yaml = require('js-yaml');

// Change working directory if user defined OPENAPI_DIR
if (process.env.OPENAPI_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.OPENAPI_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
} else if (process.env.INPUT_OPENAPI_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.INPUT_OPENAPI_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
}

console.log('process.env.GITHUB_WORKSPACE', process.env.GITHUB_WORKSPACE);
const workspace = process.env.GITHUB_WORKSPACE;
const openApiFilePath = path.join(workspace, 'openapi.yml');
const openapi = getOpenApi(openApiFilePath);

(async () => {
  const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : {};

  if (!event.commits && !process.env['INPUT_VERSION-TYPE']) {
    console.log("Couldn't find any commits in this event, incrementing patch version...");
  }

  const allowedTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
  if (process.env['INPUT_VERSION-TYPE'] && !allowedTypes.includes(process.env['INPUT_VERSION-TYPE'])) {
    exitFailure('Invalid version type');
    return;
  }

  const versionType = process.env['INPUT_VERSION-TYPE'];
  const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
  const tagSuffix = process.env['INPUT_TAG-SUFFIX'] || '';
  console.log('tagPrefix:', tagPrefix);
  console.log('tagSuffix:', tagSuffix);

  const checkLastCommitOnly = process.env['INPUT_CHECK-LAST-COMMIT-ONLY'] || 'false';

  let messages = [];
  if (checkLastCommitOnly === 'true') {
    console.log('Only checking the last commit...');
    const commit = event.commits && event.commits.length > 0 ? event.commits[event.commits.length - 1] : null;
    messages = commit ? [commit.message + '\n' + commit.body] : [];
  } else {
    messages = event.commits ? event.commits.map((commit) => commit.message + '\n' + commit.body) : [];
  }

  const commitMessage = process.env['INPUT_COMMIT-MESSAGE'] || 'ci: version bump to {{version}}';
  console.log('commit messages:', messages);

  const bumpPolicy = process.env['INPUT_BUMP-POLICY'] || 'all';
  const commitMessageRegex = new RegExp(
    commitMessage.replace(/{{version}}/g, `${tagPrefix}\\d+\\.\\d+\\.\\d+${tagSuffix}`),
    'ig',
  );

  let isVersionBump = false;

  if (bumpPolicy === 'all') {
    isVersionBump = messages.find((message) => commitMessageRegex.test(message)) !== undefined;
  } else if (bumpPolicy === 'last-commit') {
    isVersionBump = messages.length > 0 && commitMessageRegex.test(messages[messages.length - 1]);
  } else if (bumpPolicy === 'ignore') {
    console.log('Ignoring any version bumps in commits...');
  } else {
    console.warn(`Unknown bump policy: ${bumpPolicy}`);
  }

  if (isVersionBump) {
    exitSuccess('No action necessary because we found a previous bump!');
    return;
  }

  // Determine the new version based on your logic
  const newVersion = updateVersion(openapi.info.version);
  openapi.info.version = newVersion;
  writeOpenApi(openApiFilePath, openapi);

  // Git operations
  try {
    runCommand(`git add ${openApiFilePath}`);
    if (runCommand('git status --porcelain')) {
      runCommand(`git commit -m "Bump version to ${newVersion}"`);
      const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
      runCommand(`git tag ${newTag}`);
      runCommand('git push --follow-tags');
    } else {
      console.log('No changes to commit.');
    }
  } catch (error) {
    logError(error);
    exitFailure('Failed to bump version');
    return;
  }

  exitSuccess('Version bumped successfully!');
})();

function getOpenApi(filePath) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return yaml.load(readFileSync(filePath, 'utf8'));
}

function writeOpenApi(filePath, content) {
  writeFileSync(filePath, yaml.dump(content), 'utf8');
}

function updateVersion(currentVersion) {
  // Implement your versioning logic here
  const parts = currentVersion.split('.');
  parts[2] = parseInt(parts[2], 10) + 1;  // Increment patch
  return parts.join('.');
}

function runCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe' }).toString();
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing ${command}: ${error}`);
    throw error;
  }
}

function exitSuccess(message) {
  console.info(`✔  success   ${message}`);
  process.exit(0);
}

function exitFailure(message) {
  console.error(`✖  error     ${message}`);
  process.exit(1);
}

function logError(error) {
  console.error(`✖  fatal     ${error.stack || error}`);
}
