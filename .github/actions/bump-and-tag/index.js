const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openApiDir = process.env.INPUT_OPENAPI_DIR || '.';
process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

function updateVersion(currentVersion) {
    const parts = currentVersion.split('.');
    parts[2] = parseInt(parts[2], 10) + 1; // Increment patch version
    return parts.join('.');
}

const oldVersion = openapi.info.version;
const newVersion = updateVersion(oldVersion);
openapi.info.version = newVersion;
fs.writeFileSync(openApiFilePath, yaml.dump(openapi), 'utf8');

execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
if (process.env.INPUT_SKIP_COMMIT !== 'true') {
    execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`, { stdio: 'inherit' });
}

console.log("Environment Variables:", JSON.stringify(process.env, null, 2));  // This will log all environment variables

let newTag;
const tagPrefix = process.env.INPUT_TAG_PREFIX || 'DEFAULT_PREFIX';
console.log(`Tag Prefix: [${tagPrefix}]`);
const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
if (process.env.INPUT_SKIP_TAG !== 'true') {
    newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
    console.log(`Creating new tag: ${newTag}`);
    execSync(`git tag ${newTag}`, { stdio: 'inherit' });
    fs.writeFileSync(`${process.env.GITHUB_ENV}`, `newTag=${newTag}\n`, { flag: 'a' });
}

if (process.env.INPUT_SKIP_PUSH !== 'true') {
    execSync('git push', { stdio: 'inherit' });
    if (newTag) {
        execSync('git push --tags', { stdio: 'inherit' });
    }
}

fs.writeFileSync(`${process.env.GITHUB_ENV}`, `newVersion=${newVersion}\n`, { flag: 'a' });
