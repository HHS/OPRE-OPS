const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openApiDir = process.env.INPUT_OPENAPI_DIR || '.';
process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

const majorWords = process.env['INPUT_MAJOR-WORDING'] ? process.env['INPUT_MAJOR-WORDING'].split(',') : [];
const minorWords = process.env['INPUT_MINOR-WORDING'] ? process.env['INPUT_MINOR-WORDING'].split(',') : [];
const patchWords = process.env['INPUT_PATCH-WORDING'] ? process.env['INPUT_PATCH-WORDING'].split(',') : [];

function getCommitMessages() {
    return execSync('git log --format=%B -n 1').toString().trim().split('\n');
}

function determineBumpType(messages) {
    if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        return 'major';
    } else if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        return 'minor';
    } else if (messages.some(msg => patchWords.some(word => msg.includes(word)))) {
        return 'patch';
    }
    return 'patch'; // default to patch if no specific keywords found
}

function updateVersion(currentVersion, bumpType) {
    const parts = currentVersion.split('.');
    if (bumpType === 'major') {
        parts[0] = parseInt(parts[0], 10) + 1;
        parts[1] = 0;
        parts[2] = 0;
    } else if (bumpType === 'minor') {
        parts[1] = parseInt(parts[1], 10) + 1;
        parts[2] = 0;
    } else {
        parts[2] = parseInt(parts[2], 10) + 1;
    }
    return parts.join('.');
}

const messages = getCommitMessages();
const bumpType = determineBumpType(messages);
const oldVersion = openapi.info.version;
const newVersion = updateVersion(oldVersion, bumpType);
openapi.info.version = newVersion;
fs.writeFileSync(openApiFilePath, yaml.dump(openapi), 'utf8');

execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
if (process.env.INPUT_SKIP_COMMIT !== 'true') {
    execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`, { stdio: 'inherit' });
}

const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
const tagSuffix = process.env['INPUT_TAG_SUFFIX'] || '';
let newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
console.log(`Tag Prefix: [${tagPrefix}]`);
console.log(`Creating new tag: ${newTag}`);

if (process.env.INPUT_SKIP_TAG !== 'true') {
    execSync(`git tag ${newTag}`, { stdio: 'inherit' });
    console.log(`::set-output name=newTag::${newTag}`);
}

if (process.env.INPUT_SKIP_PUSH !== 'true') {
    execSync('git push', { stdio: 'inherit' });
    if (newTag) {
        execSync('git push --tags', { stdio: 'inherit' });
    }
}
