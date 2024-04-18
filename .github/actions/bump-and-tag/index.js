const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Set working directory if defined in environment variables
const packageJsonDir = process.env.OPENAPI_DIR || process.env.INPUT_OPENAPI_DIR;
if (packageJsonDir) {
    process.chdir(path.join(process.env.GITHUB_WORKSPACE, packageJsonDir));
}
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = getOpenApi(openApiFilePath);

function getOpenApi(filePath) {
    if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    return yaml.load(readFileSync(filePath, 'utf8'));
}

function writeOpenApi(filePath, content) {
    writeFileSync(filePath, yaml.dump(content), 'utf8');
}

function updateVersion(currentVersion) {
    const parts = currentVersion.split('.');
    parts[2] = parseInt(parts[2], 10) + 1; // Increment patch version
    return parts.join('.');
}

(async () => {
    const currentVersion = openapi.info.version;
    const newVersion = updateVersion(currentVersion);
    openapi.info.version = newVersion;
    writeOpenApi(openApiFilePath, openapi);

    // Configure Git
    execSync('git config user.name "Automated Version Bump"', { stdio: 'inherit' });
    execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

    execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
    if (process.env.INPUT_SKIP_COMMIT !== 'true') {
        execSync(`git commit -m "Bump OpenAPI version from ${currentVersion} to ${newVersion}"`, { stdio: 'inherit' });
    }

    if (process.env.INPUT_SKIP_TAG !== 'true') {
        const tagPrefix = process.env.INPUT_TAG_PREFIX || '';
        const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
        const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
        execSync(`git tag ${newTag}`, { stdio: 'inherit' });
        console.log(`::set-output name=newTag::${newTag}`);
    }

    if (process.env.INPUT_SKIP_PUSH !== 'true') {
        execSync('git push', { stdio: 'inherit' });
        if (process.env.INPUT_SKIP_TAG !== 'true') {
            execSync('git push --tags', { stdio: 'inherit' });
        }
    }

    console.log(`::set-output name=newVersion::${newVersion}`);
})();

