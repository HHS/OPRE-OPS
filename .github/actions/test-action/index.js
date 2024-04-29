const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN; // Access token from environment variable
    if (!token) {
      throw new Error("GitHub token is not provided");
    }

    const repository = github.context.repo;
    const branch = github.context.ref.replace('refs/heads/', ''); // Get the branch name
    const octokit = github.getOctokit(token);
    const repoUrl = `https://${token}:x-oauth-basic@github.com/${repository.owner}/${repository.repo}`;

    // Clone repo with authentication, make changes, and configure git
    execSync(`git clone -b ${branch} --single-branch ${repoUrl}`);
    process.chdir(repository.repo);
    execSync('git config user.name "GitHub Action"');
    execSync('git config user.email "action@github.com"');

    // Example: Modify files or run a script
    execSync('echo "Changes made by GitHub Action" >> file.txt');
    execSync('git add .');
    execSync(`git commit -m "Automated commit by GitHub Action"`);

    // Push changes back to the same branch with authentication
    execSync(`git push ${repoUrl} ${branch}`);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
