const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const yaml = require('js-yaml');

// Change working directory if user defined config-file-dir
if (process.env.INPUT_CONFIG_FILE_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.INPUT_CONFIG_FILE_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
}

console.log('process.env.GITHUB_WORKSPACE', process.env.GITHUB_WORKSPACE);
const workspace = process.env.GITHUB_WORKSPACE;

function getConfigFile() {
  console.log("Environment Variables:");
  console.log("INPUT_CONFIG_FILE_DIR:", process.env.INPUT_CONFIG_FILE_DIR);
  console.log("INPUT_CONFIG_FILENAME:", process.env.INPUT_CONFIG_FILENAME);
  console.log("INPUT_CONFIG_FILETYPE:", process.env.INPUT_CONFIG_FILETYPE);

  const directory = process.env.INPUT_CONFIG_FILE_DIR || '';
  const filename = process.env.INPUT_CONFIG_FILENAME || 'package.json';
  const filetype = process.env.INPUT_CONFIG_FILETYPE || 'json';
  const filePath = path.join(workspace, directory, filename);
  console.log(`Looking for ${filename} at ${filePath}`);  // Debugging output
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filename} could not be found at ${filePath}.`);
  }
  let fileContent = fs.readFileSync(filePath, 'utf8');
  return filetype === 'yaml' ? yaml.load(fileContent) : JSON.parse(fileContent);
}


function saveConfigFile(config, filename, filetype) {
  const filePath = path.join(workspace, filename);
  const content = filetype === 'yaml' ? yaml.dump(config) : JSON.stringify(config, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}

(async () => {
  const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : {};

  if (!event.commits && !process.env['INPUT_VERSION-TYPE']) {
    console.log("Couldn't find any commits in this event, incrementing patch version...");
  }

  const versionType = process.env['INPUT_VERSION-TYPE'];
  const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
  const tagSuffix = process.env['INPUT_TAG-SUFFIX'] || '';
  const checkLastCommitOnly = process.env['INPUT_CHECK-LAST-COMMIT-ONLY'] || 'false';

  let messages = [];
  if (checkLastCommitOnly === 'true') {
    const commit = event.commits && event.commits.length > 0 ? event.commits[event.commits.length - 1] : null;
    messages = commit ? [commit.message + '\n' + commit.body] : [];
  } else {
    messages = event.commits ? event.commits.map((commit) => commit.message + '\n' + commit.body) : [];
  }

  const commitMessage = process.env['INPUT_COMMIT-MESSAGE'] || 'ci: version bump to {{version}}';
  console.log('commit messages:', messages);

  let config = getConfigFile();
  let currentVersion = config.version;
  let newVersion = null;

  let versionFound = messages.some(message => {
    if (versionType && message.includes(versionType)) {
      newVersion = execSync(`npm version ${versionType}`).toString().trim();
      return true;
    }
    return false;
  });

  if (!versionFound) {
    console.log('No version keywords found, skipping bump.');
    return;
  }

  newVersion = `${tagPrefix}${newVersion}${tagSuffix}`;
  config.version = newVersion;
  saveConfigFile(config, process.env.INPUT_CONFIG_FILENAME || 'package.json', process.env.INPUT_CONFIG_FILETYPE || 'json');

  if (process.env['INPUT_SKIP-COMMIT'] !== 'true') {
    await runInWorkspace('git', ['add', '.']);
    await runInWorkspace('git', ['commit', '-m', commitMessage.replace(/{{version}}/g, newVersion)]);
  }

  if (process.env['INPUT_SKIP-TAG'] !== 'true') {
    await runInWorkspace('git', ['tag', newVersion]);
  }

  if (process.env['INPUT_SKIP-PUSH'] !== 'true') {
    const remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@${
      process.env['INPUT_CUSTOM-GIT-DOMAIN'] || 'github.com'
    }/${process.env.GITHUB_REPOSITORY}.git`;
    await runInWorkspace('git', ['push', remoteRepo, '--follow-tags']);
    await runInWorkspace('git', ['push', remoteRepo, '--tags']);
  }

  console.log('Version bumped to:', newVersion);
})();

function runInWorkspace(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: workspace });
    let isDone = false;
    const errorMessages = [];
    child.on('error', (error) => {
      if (!isDone) {
        isDone = true;
        reject(error);
      }
    });
    child.stderr.on('data', (chunk) => errorMessages.push(chunk));
    child.on('exit', (code) => {
      if (!isDone) {
        if (code === 0) {
          resolve();
        } else {
          reject(`${errorMessages.join('')}${EOL}${command} exited with code ${code}`);
        }
      }
    });
  });
}
