const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

async function run() {
  try {
    // Try retrieving the token from input first, then fallback to environment variable
    const token = core.getInput('custom_token') || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token is not provided");
    }

    const repository = github.context.repo;
    const branch = github.context.ref.replace('refs/heads/', '');
    
    // Debug: Log the domain to verify the token is not 'undefined'
    console.log("Token received, domain check:", `${token}`.substring(0, 5) + "...");

    const repoUrl = `https://${token}@github.com/${repository.owner}/${repository.repo}`;
    console.log("Repo URL (masked):", repoUrl.replace(token, '***'));

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
