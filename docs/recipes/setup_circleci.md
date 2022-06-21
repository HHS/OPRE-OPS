# How to: setup CircleCI to deploy to cloud.gov

The cloud.gov docs recommend using a [space-deployer](https://cloud.gov/docs/services/cloud-gov-service-account/) to deploy applications from continuous integration services such as CircleCI. This has already been done for the development environment, but will need to be altered and/or repeated according to the below steps for other deployment environments and cloud.gov organizations.

It is worth noting that you will need to have at least `SpaceManager` access to the cloud.gov space for which you are trying to create a `SpaceDeployer` service.

It is also worth noting that you will need admin access to the HHS OPRE-OPS CircleCI project in order to configure the cloud.gov environment variables inside CircleCI. So, first, make sure you have all the correct permissions required and then proceed with the steps below.

```
# first, log in:
cf login --sso

# then, create a service named "circleci-deployer-account" by running this command:
cf create-service cloud-gov-service-account space-deployer circleci-deployer-account

# then, create a service key for the newly-create service account by running this command:
cf create-service-key circleci-deployer-account circleci-deployer-key               

# then, retrieve the created service key for the "circleci-deployer-account" by running this command:
cf service-key circleci-deployer-account circleci-deployer-key
```

The last command will return a username/password like this:
```
{
 "password": "oYasdfliaweinasfdliecV",
 "username": "deadbeed-aabb-1234-feha0987654321000"
}
```
These are the credentials you will need to insert into the CircleCI OPRE-OPS project environment variables the names of which (currently defined there as `$DEV_USER` and `$DEV_PASSWORD`) will need to correspond to the environment variables in the deploy scripts in `.circleci/config.yml`

Update [the CircleCI environment variables](https://app.circleci.com/settings/project/github/HHS/OPRE-OPS/environment-variables) `DEV_PASSWORD` and `DEV_USER`.
