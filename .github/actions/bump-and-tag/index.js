const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function run() {
    try {
        const token = core.getInput('custom_token', { required: false }) || process.env.GITHUB_TOKEN;
        const openApiDir = core.getInput('openapi_dir', { required: false }) || '.';
        const workspace = process.env.GITHUB_WORKSPACE || '.';
        const fullPath = path.join(workspace, openApiDir);
        process.chdir(fullPath);
        const openApiFilePath = path.join(process.cwd(), 'openapi.yml');
        const openapi = yaml.load(fs.readFileSync(openApiFilePath, 'utf8'));

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
        if (!core.getBooleanInput('skip_commit', { required: false })) {
            execSync(`git commit -m "Bump OpenAPI version from ${oldVersion} to ${newVersion}"`);
        }
        const tagPrefix = core.getInput('tag_prefix', { required: false });
        const tagSuffix = core.getInput('tag_suffix', { required: false });
        const newTag = `${tagPrefix}${newVersion}${tagSuffix}`;
        if (!core.getBooleanInput('skip_tag', { required: false })) {
            execSync(`git tag ${newTag}`);
            core.setOutput('new_tag', newTag);
        }
        if (!core.getBooleanInput('skip_push', { required: false })) {
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


function determineBumpType(messages) {
  const majorWords = core.getInput('major-wording', { required: false }).split(',').map(word => word.trim());
  const minorWords = core.getInput('minor-wording', { required: false }).split(',').map(word => word.trim());
  const patchWords = core.getInput('patch-wording', { required: false }).split(',').map(word => word.trim());
  const preReleaseWords = core.getInput('rc-wording', { required: false }).split(',').map(word => word.trim());

  let bumpType = 'patch'; // default to patch if no other conditions are met
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
          parts[2] += 1; 
          break;
  }
  return parts.join('.');
}

