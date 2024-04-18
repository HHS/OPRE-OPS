const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Set working directory based on specified environment variables
const openApiDir = process.env.OPENAPI_DIR || process.env.INPUT_OPENAPI_DIR;
if (openApiDir) {
    process.chdir(path.join(process.env.GITHUB_WORKSPACE, openApiDir));
}
console.log('Current working directory:', process.cwd());

const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
const openapi = getOpenApi(openApiFilePath);

function getOpenApi(filePath) {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
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
    const oldVersion = openapi.info.version;
    const newVersion = updateVersion(oldVersion);
    openapi.info.version = newVersion;
    writeOpenApi(openApiFilePath, openapi);

    execSync('git config user.name "GitHub Action"', { stdio: 'inherit' });
    execSync('git config user.email "action@github.com"', { stdio: 'inherit' });

    execSync(`git add ${openApiFilePath}`, { stdio: 'inherit' });
    if (process.env.INPUT_SKIP_COMMIT !== 'true') {
        execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`, { stdio: 'inherit' });
    }

    let newTag;
    if (process.env.INPUT_SKIP_TAG !== 'true') {
        const tagPrefix = process.env.INPUT_TAG_PREFIX || '';
        const tagSuffix = process.env.INPUT_TAG_SUFFIX || '';
        newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
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
})();

