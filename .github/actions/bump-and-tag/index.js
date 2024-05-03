const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function run() {
    try {
        const token = core.getInput('custom_token', { required: false }) || process.env.GITHUB_TOKEN;
        console.log("Token received, checking first few characters for sanity:", `${token}`.substring(0, 5));

        const octokit = github.getOctokit(token);

        const workspace = process.env.GITHUB_WORKSPACE || '.';
        const openApiDir = core.getInput('openapi_dir', { required: false }) || '.';
        const fullPath = path.join(workspace, openApiDir);
        process.chdir(fullPath);
        console.log("Changed directory to:", fullPath);

        const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
        if (!fs.existsSync(openApiFilePath)) {
            throw new Error(`The openapi.yml file does not exist at ${openApiFilePath}`);
        }

        const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));
        console.log("Loaded OpenAPI file successfully.");

        const repo = github.context.repo;
        const branch = github.context.ref.replace('refs/heads/', '');
        console.log(`Repository: ${repo.owner}/${repo.repo}, Branch: ${branch}`);

        const { data: commits } = await octokit.rest.repos.listCommits({
            owner: repo.owner,
            repo: repo.repo,
            sha: branch,
            per_page: 10
        });
        const messages = commits.map(commit => commit.commit.message);
        console.log("Fetched commit messages:", messages);

        const bumpType = determineBumpType(messages);
        console.log("Determined version bump type as:", bumpType);

        const oldVersion = openapi.info.version;
        const newVersion = updateVersion(oldVersion, bumpType);
        openapi.info.version = newVersion;
        fs.writeFileSync(openApiFilePath, yaml.dump(openapi));
        console.log(`Updated OpenAPI version from ${oldVersion} to ${newVersion}`);

        const repoUrl = `https://${token}@github.com/${repo.owner}/${repo.repo}`;
        console.log("Using repo URL (masked):", repoUrl.replace(token, '***'));

        execSync('git config user.name "GitHub Action"');
        execSync('git config user.email "action@github.com"');
        execSync('git add .');
        console.log("Staged changes for commit.");

        if (!core.getBooleanInput('skip_commit', { required: false })) {
            execSync(`git commit -m "Automated commit by GitHub Action: Bump version from ${oldVersion} to ${newVersion}"`);
            console.log("Committed changes.");
        }

        const tagPrefix = core.getInput('tag_prefix', { required: false });
        const tagSuffix = core.getInput('tag_suffix', { required: false });
        const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
        if (!core.getBooleanInput('skip_tag', { required: false })) {
            execSync(`git tag ${newTag}`);
            core.setOutput('new_tag', newTag);
            console.log("Tagged commit as:", newTag);
        }

        if (!core.getBooleanInput('skip_push', { required: false })) {
            execSync(`git push ${repoUrl} HEAD:${branch}`);
            if (newTag) {
                execSync('git push --tags');
            }
            console.log("Pushed changes to GitHub.");
        }
    } catch (error) {
        core.setFailed(error.message);
        console.error("Error:", error.message);
    }
}

run();

function determineBumpType(messages) {
    const majorWords = core.getInput('major_wording').split(',').map(word => word.trim());
    const minorWords = core.getInput('minor_wording').split(',').map(word => word.trim());
    const patchWords = core.getInput('patch_wording').split(',').map(word => word.trim());
    const preReleaseWords = core.getInput('rc_wording').split(',').map(word => word.trim());

    let bumpType = 'patch'; // Default to patch if no other conditions are met
    if (messages.some(msg => preReleaseWords.some(word => msg.includes(word)))) {
        bumpType = 'prerelease';
    }
    if (messages.some(msg => patchWords.some(word => msg.includes(word)))) {
        bumpType = 'patch';
    }
    if (messages.some(msg => minorWords.some(word => msg.includes(word)))) {
        bumpType = 'minor';
    }
    if (messages.some(msg => majorWords.some(word => msg.includes(word)))) {
        bumpType = 'major';
    }
    return bumpType;
}

function updateVersion(oldVersion, bumpType) {
    let parts = oldVersion.split('.').map(x => parseInt(x, 10));
    switch (bumpType) {
        case 'major':
            parts[0] += 1;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1] += 1;
            parts[2] = 0;
            break;
        case 'patch':
            parts[2] += 1;
            break;
        case 'prerelease':
            parts[2] += 1; // Adjust this according to how you handle pre-release versions
            break;
    }
    return parts.join('.');
}
