// test
const { execSync, spawn } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { EOL } = require('os');
const path = require('path');
const yaml = require('js-yaml');

// Change working directory if user defined OPENAPI_DIR
if (process.env.OPENAPI_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.OPENAPI_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
} else if (process.env.INPUT_OPENAPI_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.INPUT_OPENAPI_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
}

console.log('process.env.GITHUB_WORKSPACE', process.env.GITHUB_WORKSPACE);
const workspace = process.env.GITHUB_WORKSPACE;
const openapi = getOpenApi();

(async () => {
  const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : {};

  if (!event.commits && !process.env['INPUT_VERSION-TYPE']) {
    console.log("Couldn't find any commits in this event, incrementing patch version...");
  }

  const allowedTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
  if (process.env['INPUT_VERSION-TYPE'] && !allowedTypes.includes(process.env['INPUT_VERSION-TYPE'])) {
    exitFailure('Invalid version type');
    return;
  }

  const versionType = process.env['INPUT_VERSION-TYPE'];
  const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
  const tagSuffix = process.env['INPUT_TAG-SUFFIX'] || '';
  console.log('tagPrefix:', tagPrefix);
  console.log('tagSuffix:', tagSuffix);

  const checkLastCommitOnly = process.env['INPUT_CHECK-LAST-COMMIT-ONLY'] || 'false';

  let messages = [];
  if (checkLastCommitOnly === 'true') {
    console.log('Only checking the last commit...');
    const commit = event.commits && event.commits.length > 0 ? event.commits[event.commits.length - 1] : null;
    messages = commit ? [commit.message + '\n' + commit.body] : [];
  } else {
    messages = event.commits ? event.commits.map((commit) => commit.message + '\n' + commit.body) : [];
  }

  const commitMessage = process.env['INPUT_COMMIT-MESSAGE'] || 'ci: version bump to {{version}}';
  console.log('commit messages:', messages);

  const bumpPolicy = process.env['INPUT_BUMP-POLICY'] || 'all';
  const commitMessageRegex = new RegExp(
    commitMessage.replace(/{{version}}/g, `${tagPrefix}\\d+\\.\\d+\\.\\d+${tagSuffix}`),
    'ig',
  );

  let isVersionBump = false;

  if (bumpPolicy === 'all') {
    isVersionBump = messages.find((message) => commitMessageRegex.test(message)) !== undefined;
  } else if (bumpPolicy === 'last-commit') {
    isVersionBump = messages.length > 0 && commitMessageRegex.test(messages[messages.length - 1]);
  } else if (bumpPolicy === 'ignore') {
    console.log('Ignoring any version bumps in commits...');
  } else {
    console.warn(`Unknown bump policy: ${bumpPolicy}`);
  }

  if (isVersionBump) {
    exitSuccess('No action necessary because we found a previous bump!');
    return;
  }

  // input wordings for MAJOR, MINOR, PATCH, PRE-RELEASE
  const majorWords = process.env['INPUT_MAJOR-WORDING'].split(',').filter((word) => word != '');
  const minorWords = process.env['INPUT_MINOR-WORDING'].split(',').filter((word) => word != '');
  const patchWords = process.env['INPUT_PATCH-WORDING'] ? process.env['INPUT_PATCH-WORDING'].split(',') : null;
  const preReleaseWords = process.env['INPUT_RC-WORDING'] ? process.env['INPUT_RC-WORDING'].split(',') : null;

  console.log('config words:', { majorWords, minorWords, patchWords, preReleaseWords });

  // get default version bump
  let version = process.env.INPUT_DEFAULT;
  let foundWord = null;
  // get the pre-release prefix specified in action
  let preid = process.env.INPUT_PREID;

  // case if version-type found
  if (versionType) {
    version = versionType;
  }
  // case: if wording for MAJOR found
  else if (
    messages.some(
      (message) => /^([a-zA-Z]+)(\(.+\))?(\!)\:/.test(message) || majorWords.some((word) => message.includes(word)),
    )
  ) {
    version = 'major';
  }
  // case: if wording for MINOR found
  else if (messages.some((message) => minorWords.some((word) => message.includes(word)))) {
    version = 'minor';
  }
  // case: if wording for PATCH found
  else if (patchWords && messages.some((message) => patchWords.some((word) => message.includes(word)))) {
    version = 'patch';
  }
  // case: if wording for PRE-RELEASE found
  else if (
    preReleaseWords &&
    messages.some((message) =>
      preReleaseWords.some((word) => {
        if (message.includes(word)) {
          foundWord = word;
          return true;
        } else {
          return false;
        }
      }),
    )
  ) {
    if (foundWord !== '') {
      preid = foundWord.split('-')[1];
    }
    version = 'prerelease';
  }

  console.log('version action after first waterfall:', version);

  // case: if default=prerelease,
  // rc-wording is also set
  // and does not include any of rc-wording
  // and version-type is not strictly set
  // then unset it and do not run
  if (
    version === 'prerelease' &&
    preReleaseWords &&
    !messages.some((message) => preReleaseWords.some((word) => message.includes(word))) &&
    !versionType
  ) {
    version = null;
  }

  // case: if default=prerelease, but rc-wording is NOT set
  if (['prerelease', 'prepatch', 'preminor', 'premajor'].includes(version) && preid) {
    version = `${version} --preid=${preid}`;
  }

  console.log('version action after final decision:', version);

  // case: if nothing of the above matches
  if (!version) {
    exitSuccess('No version keywords found, skipping bump.');
    return;
  }

  // case: if user sets push to false, to skip pushing new tag/package.json
  const push = process.env['INPUT_PUSH'];
  if (push === 'false' || push === false) {
    exitSuccess('User requested to skip pushing new tag and package.json. Finished.');
    return;
  }

  // GIT logic
  try {
    const current = openapi.info.version;
    // set git user
    await runInWorkspace('git', ['config', 'user.name', `"${process.env.GITHUB_USER || 'Automated Version Bump'}"`]);
    await runInWorkspace('git', [
      'config',
      'user.email',
      `"${process.env.GITHUB_EMAIL || 'gh-action-bump-version@users.noreply.github.com'}"`,
    ]);

    let currentBranch;
    let isPullRequest = false;
    if (process.env.GITHUB_HEAD_REF) {
      // Comes from a pull request
      currentBranch = process.env.GITHUB_HEAD_REF;
      isPullRequest = true;
    } else {
      let regexBranch = /refs\/[a-zA-Z]+\/(.*)/.exec(process.env.GITHUB_REF);
      // If GITHUB_REF is null then do not set the currentBranch
      currentBranch = regexBranch ? regexBranch[1] : undefined;
    }
    if (process.env['INPUT_TARGET-BRANCH']) {
      // We want to override the branch that we are pulling / pushing to
      currentBranch = process.env['INPUT_TARGET-BRANCH'];
    }
    console.log('currentBranch:', currentBranch);

    if (!currentBranch) {
      exitFailure('No branch found');
      return;
    }

    // do it in the current checked out github branch (DETACHED HEAD)
    // important for further usage of the openapi version
    await runInWorkspace('git', ['add', 'openapi.yml']);
    console.log('current 1:', current, '/', 'version:', version);
    if (process.env['INPUT_SKIP-COMMIT'] !== 'true') {
      await runInWorkspace('git', ['commit', '-a', '-m', commitMessage.replace(/{{version}}/g, version)]);
    }

    // now go to the actual branch to perform the same versioning
    if (isPullRequest) {
      // First fetch to get updated local version of branch
      await runInWorkspace('git', ['fetch']);
    }
    await runInWorkspace('git', ['checkout', currentBranch]);
    if (process.env['INPUT_SKIP-COMMIT'] !== 'true') {
      await runInWorkspace('git', ['commit', '-a', '-m', commitMessage.replace(/{{version}}/g, version)]);
    }

    const remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@${
      process.env['INPUT_CUSTOM-GIT-DOMAIN'] || 'github.com'
    }/${process.env.GITHUB_REPOSITORY}.git`;
    if (process.env['INPUT_SKIP-TAG'] !== 'true') {
      await runInWorkspace('git', ['tag', `${tagPrefix}${version}${tagSuffix}`]);
      if (process.env['INPUT_SKIP-PUSH'] !== 'true') {
        await runInWorkspace('git', ['push', remoteRepo, '--follow-tags']);
        await runInWorkspace('git', ['push', remoteRepo, '--tags']);
      }
    } else {
      if (process.env['INPUT_SKIP-PUSH'] !== 'true') {
        await runInWorkspace('git', ['push', remoteRepo]);
      }
    }
  } catch (e) {
    logError(e);
    exitFailure('Failed to bump version');
    return;
  }
  exitSuccess('Version bumped!');
})();

function getOpenApi() {
  const openApiFileName = 'openapi.yml';
  const filePath = path.join(workspace, openApiFileName);
  if (!existsSync(filePath)) throw new Error(openApiFileName + " could not be found in your project's root.");
  return yaml.load(readFileSync(filePath, 'utf8'));
}

function exitSuccess(message) {
  console.info(`✔  success   ${message}`);
  process.exit(0);
}

function exitFailure(message) {
  console.error(`✖  error     ${message}`);
  process.exit(1);
}

function logError(error) {
  console.error(`✖  fatal     ${error.stack || error}`);
}

function runInWorkspace(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: workspace });
    let isDone = false;
    const errorMessages = [];
    child.on('error', (error) => {
      if (!isDone) {
        isDone = true;
        reject(error);
      }
    });
    child.stderr.on('data', (data) => errorMessages.push(data.toString()));
    child.stdout.on('data', (data) => console.log(data.toString()));
    child.on('exit', (code) => {
      if (!isDone) {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command '${command}' exited with code ${code}: ${errorMessages.join('')}`));
        }
      }
    });
  });
}
