const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Setup working directory
const openApiDir = process.env.INPUT_OPENAPI_DIR || '.';
process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
console.log('Current working directory:', process.cwd());

// Load the OpenAPI file
const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

// Function to determine the type of version bump needed
function determineBumpType(messages) {
    const majorWords = process.env.INPUT_MAJOR_WORDING.split(',').map(word => word.trim());
    const minorWords = process.env.INPUT_MINOR_WORDING.split(',').map(word => word.trim());
    const patchWords = process.env.INPUT_PATCH_WORDING.split(',').map(word => word.trim());
    const preReleaseWords = process.env.INPUT_RC_WORDING.split(',').map(word => word.trim());

    if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        return 'major';
    } else if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        return 'minor';
    } else if (messages.some(msg => preReleaseWords.some(word => msg.includes(word)))) {
        return 'prerelease';
    } else if (messages.some(msg => patchWords.some(word => msg.includes(word)))) {
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
            parts[3] = parseInt(parts[3] || '0', 10) + 1; // Assumes 'prerelease' is the fourth segment
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

console.log(`Bump type: ${bumpType}, Old version: ${oldVersion}, New version: ${newVersion}`);

// Configure git
execSync('git config user.name "GitHub Actions"');
execSync('git config user.email "action@github.com"');

// Commit changes
execSync(`git add ${openApiFilePath}`);
execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`);

// Tagging
const tagPrefix = process.env['INPUT_TAG_PREFIX'] || '';
const newTag = `${tagPrefix}${newVersion}`;
console.log(`Creating new tag: ${newTag}`);

execSync(`git tag ${newTag}`);

// Explicit Git URL configuration using GIT_TOKEN
const token = process.env.GIT_TOKEN;
const repoSlug = process.env.GITHUB_REPOSITORY;
const repoURL = `https://${token}@github.com/${repoSlug}`;

console.log(`Preparing to push changes. Verifying token...`);
console.log(`Token usage confirmation (masked): ${'*'.repeat(10)}`);

try {
    execSync(`git push ${repoURL} HEAD:main --tags`, { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to push changes:', error);
    console.error('Error details:', error.message);
    process.exit(1);
}
