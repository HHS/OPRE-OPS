# Tutorials on running the data loading scripts

## Running a data loading script locally with a local TSV file

- Start the stack with e.g. `docker compose -f docker-compose.initial.yml up --build`
- Run with the `--env` set to `dev`, e.g.

```
cd backend
python data_tools/src/load_projects/main.py --env dev --input-csv data_tools/test_csv/projects_latest.tsv
```

## Running a data loading script locally with a TSV file in an Azure storage account

### Upload a TSV file to Azure and set appropriate permissions

- Assign the role "Storage Blob Data Contributor" to yourself on the storage account.
- Make sure the blob container, e.g. https://opreopsdevappsa.blob.core.windows.net/data/, is set to "Authentication method: Microsoft Entra user account"
- Upload a TSV file using the Azure portal to: https://opreopsdevappsa.blob.core.windows.net/data/

### Create an .env file

- Create a `.env` file in the `backend/` directory with the following contents (where your DB is in local Docker):

```
PGUSER=ops
PGPASSWORD=XXXXXX
PGDATABASE=postgres
PGHOST=localhost
PGPORT=5432
FILE_STORAGE_AUTH_METHOD=rbac
```

### Run the command

- You can optionally load environment variables from an `.env` file by exporting the following: `export ENV_FILE=.env`.  Loading `.env` is also the default.
- Run with the `--env` set to `azure`, e.g.

```
cd backend
python data_tools/src/load_projects/main.py --env azure --input-csv https://opreopsdevappsa.blob.core.windows.net/data/projects_latest.tsv
```
