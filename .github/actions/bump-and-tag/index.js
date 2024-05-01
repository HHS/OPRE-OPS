const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function run() {
    try {
        // Get the custom token or fall back to the default GitHub token
        const token = core.getInput('custom-token', { required: false }) || process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GitHub token is not provided');
        }

        const workspace = process.env.GITHUB_WORKSPACE || '.';
        const openApiDir = core.getInput('openapi-dir', { required: false }) || '.';
        process.chdir(path.join(workspace, openApiDir));
        const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
        const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8')); 'utf8'));

        const octokit = github.getOctokit(token);
        const { repo } = github.context;
        const { data: commits } = await octokit.rest.repos.listCommits({
            owner: repo.owner,
            repo: repo.repo,
            sha: 'HEAD',
            per_page: 10
        });
        const messages = commits.map(commit => commit.commit.message);

        const bumpType = determineBumpType(messages);
        const oldVersion = openapi.info.version;
        const newVersion = updateVersion(oldVersion, bumpType);
        openapi.info.version = newVersion;
        fs.writeFileSync(openApiFilePath, yaml.dump(openapi));

        execSync('git config user.name "GitHub Action"');
        execSync('git config user.email "action@github.com"');
        execSync(`git add ${openApiFilePath}`);

        if (!core.getBooleanInput('SKIP_COMMIT', { required: false })) {
            execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`);
        }

        const tagPrefix = core.getInput('TAG_PREFIX', { required: false });
        const tagSuffix = core.getInput('TAG_SUFFIX', { required: false });
        const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
        if (!core.getBooleanInput('SKIP_TAG', { required: false })) {
            execSync(`git tag ${newTag}`);
            core.setOutput('newTag', newTag);
        }

        if (!core.getBooleanInput('SKIP_PUSH', { required: false })) {
            execSync('git push');
            if (newTag) {
                execSync('git push --tags');
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
