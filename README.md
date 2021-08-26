# OPRE OPS

## Getting Started
### Running the Application locally

Application built using [pack Buildpack CLI](https://github.com/buildpacks/pack) and runs within Docker.

Instructions to start app locally:

1. Make sure you have Docker installed and started locally
2. Make sure you have pack installed, see [this link](https://buildpacks.io/docs/tools/pack/) for instructions

From the project root run:

```
# This step builds an image for the web app using the `pack` tool.
pack build opre-ops --builder gcr.io/buildpacks/builder:v1

# This step starts the web app and database services locally usiing Docker.
docker-compose up
```

Then navigate to http://localhost:8080 in your browser
