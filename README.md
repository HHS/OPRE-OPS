# OPRE OPS

## Getting Started
### Running the Application locally

Application built using [pack Buildpack CLI](https://github.com/buildpacks/pack) and runs within Docker.

Instructions to start app locally:

1. Make sure you have Docker installed and started locally
2. Make sure you have pack installed, see [this link](https://buildpacks.io/docs/tools/pack/) for instructions

From the project root run:
```
pack build opre-ops --builder gcr.io/buildpacks/builder:v1
docker run --rm -p 8080:8080 opre-ops
```

Then navigate to http://localhost:8080 in your browser
