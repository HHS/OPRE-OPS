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
  const commitMessages = event.commits ? event.commits.map(commit => `${commit.message} ${commit.body}`).join(EOL) : "";
  console.log('Commit messages:', commitMessages);

  const versionType = process.env['INPUT_VERSION-TYPE'];
  const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
  const tagSuffix = process.env['INPUT_TAG-SUFFIX'] || '';
  console.log('tagPrefix:', tagPrefix);
  console.log('tagSuffix:', tagSuffix);

  const commitMessage = process.env['INPUT_COMMIT-MESSAGE'] || 'ci: version bump to {{version}}';
  
  const newVersion = updateVersion(openapi.info.version);
  openapi.info.version = newVersion;
  writeOpenApi(openApiFilePath, openapi);
  
  // Setting Git configuration in the workspace
  execSync('git config user.name "Automated Version Bump"', { stdio: 'ignore' });
  execSync('git config user.email "gh-action-bump-version@users.noreply.github.com"', { stdio: 'ignore' });

  try {
    execSync(`git add ${openApiFilePath}`);
    execSync(`git commit -m "${commitMessage.replace('{{version}}', newVersion)}"`);
    if (tagPrefix || tagSuffix) {
      const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
      execSync(`git tag ${newTag}`);
    }
    execSync('git push --follow-tags');
  } catch (error) {
    console.error('Failed to commit and push changes:', error);
    process.exit(1);
  }

  console.log('Version bumped successfully!');
})();

function getOpenApi(filePath) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return yaml.load(readFileSync(filePath, 'utf8'));
}

function writeOpenApi(filePath, content) {
  writeFileSync(filePath, yaml.dump(content), 'utf8');
}

function updateVersion(currentVersion) {
  // Example version updating logic: simply increments the patch version
  let [major, minor, patch] = currentVersion.split('.').map(num => parseInt(num, 10));
  patch++;
  return `${major}.${minor}.${patch}`;
}
