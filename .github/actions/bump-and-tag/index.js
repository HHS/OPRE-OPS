const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Ensure that GITHUB_TOKEN is available as an environment variable
const token = process.env.GITHUB_TOKEN;
if (!token) {
    console.error('GitHub token not found. Make sure it is set in environment variables.');
    process.exit(1);
}

const repoUrlWithToken = `https://${token}@github.com/${process.env.GITHUB_REPOSITORY}`;

// Setup working directory
const openApiDir = process.env.INPUT_OPENAPI_DIR || '.';
process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
console.log('Current working directory:', process.cwd());

// Load the OpenAPI file
const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

// Function to determine the type of version bump needed
function determineBumpType(messages) {
    const majorWords = (process.env.INPUT_MAJOR_WORDING || 'BREAKING CHANGE,major').split(',').map(word => word.trim());
    const minorWords = (process.env.INPUT_MINOR_WORDING || 'feat,minor').split(',').map(word => word.trim());
    const patchWords = (process.env.INPUT_PATCH_WORDING || '').split(',').map(word => word.trim());
    const preReleaseWords = (process.env.INPUT_RC_WORDING || 'pre-alpha,pre-beta,pre-rc').split(',').map(word => word.trim());

    if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        return 'major';
    } else if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        return 'minor';
    } else if (messages.some(msg => preReleaseWords.some(word => msg.includes(word)))) {
        return 'prerelease';
    } else if (messages.some(msg => patchWords && patchWords.some(word => msg.includes(word)))) {
        return 'patch';
    }
    return 'patch'; // Default bump type if no other wordings are matched
}

// Function to update the version based on the bump type
function updateVersion(currentVersion, bumpType) {
    const parts = currentVersion.split('.');
    switch (bumpType) {
        case 'major':
            parts[0] = parseInt(parts[0], 10) + 1;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1] = parseInt(parts[1], 10) + 1;
            parts[2] = 0;
            break;
        case 'prerelease':
            parts[3] = parseInt(parts[3] || '0', 10) + 1;
            break;
        case 'patch':
        default:
            parts[2] = parseInt(parts[2], 10) + 1;
            break;
    }
    return parts.join('.');
}

// Fetch all recent commit messages and determine bump type
const messages = execSync('git log --format=%B -n 10').toString().trim().split('\n\n');
const bumpType = determineBumpType(messages);
const oldVersion = openapi.info.version;
const newVersion = updateVersion(oldVersion, bumpType);
openapi.info.version = newVersion;
fs.writeFileSync(openApiFilePath, yaml.dump(openapi), 'utf8');

// Configure git for commit
console.log('Configuring git user settings...');
execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

// Commit changes
console.log(`Adding ${openApiFilePath} to git...`);
execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
if (process.env.INPUT_SKIP_COMMIT !== 'true') {
    console.log(`Committing changes for version bump from ${oldVersion} to ${newVersion}...`);
    execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`, { stdio: 'inherit' });
}

// Set remote URL to ensure correct token usage
console.log(`Setting remote URL...`);
execSync(`git remote set-url origin ${repoUrlWithToken}`);

// Tagging and Pushing with authenticated URL
const tagPrefix = process.env.INPUT_TAG_PREFIX || '';
const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;

if (process.env.INPUT_SKIP_TAG !== 'true') {
    console.log(`Creating new tag: ${newTag}`);
    execSync(`git tag ${newTag}`, { stdio: 'inherit' });
}

if (process.env.INPUT_SKIP_PUSH !== 'true') {
    console.log(`Pushing changes and tags to repository...`);
    execSync(`git push origin HEAD:refs/heads/${process.env.GITHUB_REF_NAME}`, { stdio: 'inherit' });
    if (newTag) {
        console.log(`Pushing tags...`);
        execSync(`git push origin --tags`, { stdio: 'inherit' });
    }
}
