# Cloud.gov Deployment Action

A Github action for using Cloud Foundry (CF) CLI tools while deploying and managing apps on [cloud.gov](https://cloud.gov).

## Usage

Follow the instructions for setting up a [cloud.gov service account](https://cloud.gov/docs/services/cloud-gov-service-account/). Store you username (CG_USERNAME) and password (CG_PASSWORD) as [encrypted secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

## Sample workflow

The following is an example of a workflow that uses this action. This example shows how to deploy a simple .NET Core app to cloud.gov

```yml
name: Deploy Frontend

on:
  pull_request:
    branches: [ {branch-name} ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'yarn'
        cache-dependency-path: '**/yarn.lock'
    - name: Install yarn dependencies
      shell: bash
      working-directory: ./frontend
      run: yarn install --frozen-lockfile

    - name: Build
      run: yarn build

  deploy:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v2
      - name: Deploy to cloud.gov
        uses: ./.github/actions/cloud-gov-deploy
        with:
          cf_username: ${{ secrets.CG_USERNAME }}
          cf_password: ${{ secrets.CG_PASSWORD }}
          cf_org: your-org
          cf_space: your-space

```

The default action is to do a `cf push -f manifest.yml --strategy rolling`.

You can also supply the following in the 'with:' section:

- `cf_api:` to specify a Cloud Foundry API endpoint (instead of the default `api.fr.cloud.gov`)
- `cf_manifest:` to use a different manifest file (instead of the default `manifest.yml`)
- `cf_vars_file:` to [specify values for variables in the manifest file](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest-attributes.html#variable-substitution)
- `cf_command:` to specify a CF sub-command to run (instead of the default `push -f $MANIFEST -vars-file $VARS_FILE --strategy rolling`)
- `command:` to specify another command altogether (for example: a script which checks if required services are present and creates them if they're missing)
