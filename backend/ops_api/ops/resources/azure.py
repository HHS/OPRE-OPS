from datetime import datetime, timedelta

# from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobSasPermissions, generate_blob_sas
from flask import Response, current_app
from flask.views import MethodView

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.utils.response import make_response_with_headers

# Replace these with your Azure Storage Account details
# STORAGE_ACCOUNT_NAME = current_app.config.get("STORAGE_ACCOUNT_NAME")
# STORAGE_ACCOUNT_KEY = current_app.config.get("STORAGE_ACCOUNT_KEY")
CONTAINER_NAME = "uploads"  # Temp directory for storing uploads during testing.

# Testing using local default azure creds
# default_credentials = DefaultAzureCredential()


def generate_sas_token(container_name, blob_name, account_name, account_key, permission, expiry_hours=1):
    """Generate a SAS token for Azure Blob Storage."""
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=permission,
        expiry=datetime.utcnow() + timedelta(hours=expiry_hours),
    )
    return sas_token


class SasToken(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        current_app.logger.debug("Reaching out for an Azure SAS token")
        # TODO: Maybe replace this with the Agreement Name? Or pass this is as a parameter.
        # to allow storing files in different locations per Agreement?
        blob_name = "uploads"
        # Generate the SAS token
        sas_token = generate_sas_token(
            CONTAINER_NAME,
            blob_name,
            current_app.config.get("STORAGE_ACCOUNT_NAME"),
            current_app.config.get("STORAGE_ACCOUNT_KEY"),
            BlobSasPermissions(write=True),
        )
        response = make_response_with_headers({"sas_token": sas_token})

        # Construct the full URL with SAS token for debug
        # blob_url_with_sas = f"https://{STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{CONTAINER_NAME}/{blob_name}?{sas_token}"

        return response
