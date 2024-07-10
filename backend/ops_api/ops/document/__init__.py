from flask import Blueprint

bp = Blueprint("documents", __name__)

from ops_api.ops.document.api import *  # noqa
