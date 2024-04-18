const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { EOL } = require('os');
const path = require('path');
const yaml = require('js-yaml');

// Adjusting directory based on user input
const packageJsonDir = process.env.PACKAGEJSON_DIR || process.env.INPUT_PACKAGEJSON_DIR;
if (packageJsonDir) {
  process.chdir(path.join(process.env.GITHUB_WORKSPACE, packageJsonDir));
}
console.log('Working directory set to:', process.cwd());

// Getting and processing the OpenAPI file
const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = getOpenApi(openApiFilePath);

(async () => {
  // Determine if skipping certain steps based on input flags
  const skipTag = process.env.INPUT_SKIP_TAG === 'true';
  const skipCommit = process.env.INPUT_SKIP_COMMIT === 'true';
  const skipPush = process.env.INPUT_SKIP_PUSH === 'true';

  const newVersion = updateVersion(openapi.info.version);
  openapi.info.version = newVersion;
  writeOpenApi(openApiFilePath, openapi);

  // Setting Git configuration to handle identity issues
  execSync('git config user.name "Automated Version Bump"', { stdio: 'inherit' });
  execSync('git config user.email "gh-action-bump-version@users.noreply.github.com"', { stdio: 'inherit' });

  execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
  if (!skipCommit) {
    execSync(`git commit -m "Bump version to ${newVersion}"`, { stdio: 'inherit' });
  }

  if (!skipTag) {
    const tagPrefix = process.env['INPUT_TAG_PREFIX'] || '';
    const tagSuffix = process.env['INPUT_TAG_SUFFIX'] || '';
    const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
    execSync(`git tag ${newTag}`, { stdio: 'inherit' });
  }

  if (!skipPush) {
    execSync('git push', { stdio: 'inherit' });
    if (!skipTag) {
      execSync('git push --tags', { stdio: 'inherit' });
    }
  }
})();

function getOpenApi(filePath) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return yaml.load(readFileSync(filePath, 'utf8'));
}

function writeOpenApi(filePath, content) {
  writeFileSync(filePath, yaml.dump(content), 'utf8');
}

function updateVersion(currentVersion) {
  const parts = currentVersion.split('.');
  parts[2] = parseInt(parts[2], 10) + 1; // Increment patch number
  return parts.join('.');
}
