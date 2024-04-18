const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Set working directory based on OPENAPI_DIR or INPUT_OPENAPI_DIR
const packageJsonDir = process.env.OPENAPI_DIR || process.env.INPUT_OPENAPI_DIR;
if (packageJsonDir) {
    process.chdir(path.join(process.env.GITHUB_WORKSPACE, packageJsonDir));
}
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = getOpenApi(openApiFilePath);

function getOpenApi(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function writeOpenApi(filePath, content) {
    fs.writeFileSync(filePath, yaml.dump(content), 'utf8');
}

function updateVersion(currentVersion) {
    const parts = currentVersion.split('.');
    parts[2] = parseInt(parts[2], 10) + 1; // Increment patch version
    return parts.join('.');
}

(async () => {
    const newVersion = updateVersion(openapi.info.version);
    openapi.info.version = newVersion;
    writeOpenApi(openApiFilePath, openapi);

    // Git configuration to ensure user identity is set
    execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
    execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

    // Git operations
    execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
    execSync(`git commit -m "Bump OpenAPI version to ${newVersion}"`, { stdio: 'inherit' });

    const skipTag = process.env.INPUT_SKIP_TAG === 'true';
    if (!skipTag) {
        const tagPrefix = process.env.INPUT_TAG_PREFIX || '';
        const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
        const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
        execSync(`git tag ${newTag}`, { stdio: 'inherit' });
        console.log(`::set-output name=newTag::${newTag}`);
    }

    const skipPush = process.env.INPUT_SKIP_PUSH === 'true';
    if (!skipPush) {
        execSync('git push', { stdio: 'inherit' });
        if (!skipTag) {
            execSync('git push --tags', { stdio: 'inherit' });
        }
    }

    console.log(`::set-output name=newVersion::${newVersion}`);
})();

