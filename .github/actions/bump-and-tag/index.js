const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const openApiDir = process.env.INPUT_OPENAPI_DIR || '.';
process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

function getCommitMessages() {
    return execSync('git log --format=%B -n 10').toString().trim().split('\n\n');
}

function determineBumpType(messages) {
    const majorWords = (process.env.INPUT_MAJOR_WORDING || 'BREAKING CHANGE,major').split(',');
    const minorWords = (process.env.INPUT_MINOR_WORDING || 'feat,minor').split(',');
    const patchWords = (process.env.INPUT_PATCH_WORDING || '').split(',');
    const preReleaseWords = (process.env.INPUT_RC_WORDING || 'pre-alpha,pre-beta,pre-rc').split(',');

    if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        return 'major';
    } else if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        return 'minor';
    } else if (messages.some(msg => preReleaseWords.some(word => msg.includes(word)))) {
        return 'prerelease';
    } else if (messages.some(msg => patchWords.some(word => msg.includes(word)))) {
        return 'patch';
    }
    return 'patch'; // Default if no keywords found
}

const oldVersion = openapi.info.version;
const messages = getCommitMessages();
const bumpType = determineBumpType(messages);
const newVersion = updateVersion(oldVersion, bumpType);
openapi.info.version = newVersion;
fs.writeFileSync(openApiFilePath, yaml.dump(openapi), 'utf8');

execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
if (process.env.INPUT_SKIP_COMMIT !== 'true') {
    execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`, { stdio: 'inherit' });
}

const tagPrefix = process.env.INPUT_TAG_PREFIX || '';
const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
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
