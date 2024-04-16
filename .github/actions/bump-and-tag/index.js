const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { EOL } = require('os');
const path = require('path');
const yaml = require('js-yaml'); // Ensure you have js-yaml installed

const configFiles = {
  'package.json': {
    filename: 'package.json',
    versionPath: 'version',
    type: 'json'
  },
  'openapi.yml': {
    filename: 'openapi.yml',
    versionPath: 'info.version',
    type: 'yaml'
  }
};

// Determine which config file to use
const configFileKey = process.env.CONFIG_TYPE || 'package.json';
const configFile = configFiles[configFileKey];

if (!configFile) {
  console.error('Unsupported config file type');
  process.exit(1);
}

// Change working directory if user defined CONFIG_DIR
const configDirEnvVar = `${configFileKey.toUpperCase().replace('.', '_')}_DIR`;
if (process.env[configDirEnvVar]) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env[configDirEnvVar]}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
}

console.log('process.env.GITHUB_WORKSPACE', process.env.GITHUB_WORKSPACE);
const workspace = process.env.GITHUB_WORKSPACE;
const configData = getConfigData();

(async () => {
  // Example of checking the current version and bumping it
  let currentVersion = getConfigVersion(configData);
  console.log('Current version:', currentVersion);
  let newVersion = bumpVersion(currentVersion, 'minor');  // Assuming you want to bump minor version
  setConfigVersion(configData, newVersion);
  console.log('New version set in file:', newVersion);

  // Implement GIT operations similar to what you have in your existing script
})();

function getConfigData() {
  const filePath = path.join(workspace, configFile.filename);
  if (!existsSync(filePath)) throw new Error(`${configFile.filename} could not be found in your project's root.`);
  
  const fileContent = readFileSync(filePath, 'utf8');
  return configFile.type === 'json' ? JSON.parse(fileContent) : yaml.load(fileContent);
}

function getConfigVersion(data) {
  return configFile.versionPath.split('.').reduce((o, k) => (o || {})[k], data);
}

function setConfigVersion(data, newVersion) {
  const pathParts = configFile.versionPath.split('.');
  const lastPart = pathParts.pop();
  const lastObj = pathParts.reduce((o, k) => o[k] = o[k] || {}, data);
  lastObj[lastPart] = newVersion;

  const filePath = path.join(workspace, configFile.filename);
  const fileContent = configFile.type === 'json' ? JSON.stringify(data, null, 2) : yaml.dump(data);
  writeFileSync(filePath, fileContent, 'utf8');
}

function bumpVersion(currentVersion, type) {
  let [major, minor, patch] = currentVersion.split('.').map(x => parseInt(x));
  switch (type) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
      patch++;
      break;
  }
  return `${major}.${minor}.${patch}`;
}

function exitSuccess(message) {
  console.info(`✔  success   ${message}`);
  process.exit(0);
}

function exitFailure(message) {
  console.error(`✖  fatal     ${message}`);
  process.exit(1);
}

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
    child.stderr.on('data', (chunk) => errorMessages.push(chunk.toString()));
    child.stdout.on('data', (chunk) => console.log(chunk.toString()));
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
