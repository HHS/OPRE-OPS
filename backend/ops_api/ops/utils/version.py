import os

import yaml
from flask import jsonify
from flask.views import MethodView

# Cache the API version at module load time to avoid reading the file on every request
_CACHED_VERSION = None


def _load_api_version():
    """Load API version from openapi.yml once at startup."""
    global _CACHED_VERSION
    if _CACHED_VERSION is not None:
        return _CACHED_VERSION

    current_dir = os.getcwd()
    openapi_path = os.path.join(current_dir, "openapi.yml")
    try:
        with open(openapi_path, "r") as file:
            openapi_spec = yaml.safe_load(file)
            _CACHED_VERSION = openapi_spec.get("info", {}).get("version", "Unknown")
            return _CACHED_VERSION
    except FileNotFoundError:
        _CACHED_VERSION = f"OpenAPI spec file not found at {openapi_path}"
        return _CACHED_VERSION
    except Exception as e:
        _CACHED_VERSION = f"Error reading openapi.yml: {str(e)}"
        return _CACHED_VERSION


class VersionAPI(MethodView):

    @staticmethod
    def get_api_version():
        """Get the cached API version."""
        return _load_api_version()

    def get(self):
        return jsonify({"version": self.get_api_version()})
