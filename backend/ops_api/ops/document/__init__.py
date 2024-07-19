from flask import Blueprint

bp = Blueprint("documents", __name__)

from ops_api.ops.document.api import create_document, get_documents_by_agreement_id  # noqa: E402, F401
