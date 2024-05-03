const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;  // Using directly for consistency
    const repository = github.context.repo;
    const branch = github.context.ref.replace('refs/heads/', '');
    const repoUrl = `https://${token}@github.com/${repository.owner}/${repository.repo}`;

    // Clone, change directory, configure git, modify files, commit, and push
    execSync(`git clone -b ${branch} --single-branch ${repoUrl}`);
    process.chdir(repository.repo);
    execSync('git config user.name "GitHub Action"');
    execSync('git config user.email "action@github.com"');
    execSync('echo "Changes made by GitHub Action" >> file.txt');
    execSync('git add .');
    execSync(`git commit -m "Automated commit by GitHub Action"`);
    execSync(`git push ${repoUrl} ${branch}`);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
