# Data-Tools

This is a developer tool used to load in sample data, into the database.

## Quick Start

Ensure the Database you wish to populate is configured in a config file `/environment/<config>.py`;
At minimum you should define a `db_connection_string`.
```python
@property
    def db_connection_string(self):
        return "postgresql://<user>:<password>@<host>:<port>/<database>"
```

You can then run an all-in-one script to load all data that is located at `/scripts/import_data.sh`

### Docker
You can execute the following to perform the data-load from a docker image:
```sh
# Execute from project root
docker build -t ops-data-tools:<tag> -f ./backend/Dockerfile.data-tools ./backend
docker run -e ENV=<config> ops-data-tools ./data_tools/scripts/import_data.sh
```
Ensure you update the `<tag>` and `<config>` values.

Exiting pre-build images will exist at: ghcr.io/hhs/opre-ops/ops-data-tools:latest

```
docker run -e ENV=<config> ghcr.io/hhs/opre-ops/ops-data-tools:latest ./data_tools/scripts/import_data.sh
```

## Data
The `/data` directory contains multiple `.json5` files which container the sample data.
Currently there are multiple tables represented in each file. They are intended to be grouped based on relationship, but that may not be 100% feasable.

## Configuration
The current configurations are loaded from the `/environment` files. These are Python class files, with properties defined for each configuration value.

A base config `common.py {DataToolsConfig}` exists, with `dev.py` being the default if no other config is defined.

Configurations should be defined in an ENV variable called `ENV`.
```
ENV=dev
or
ENV=cloudgov
```
If no ENV is defined, then `dev.py` is used.
