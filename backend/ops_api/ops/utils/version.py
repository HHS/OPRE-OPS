import os
import yaml
from flask.views import MethodView
from flask import jsonify


class VersionAPI(MethodView):

    @staticmethod
    def get_api_version():
        current_dir = os.getcwd()
        openapi_path = os.path.join(current_dir, "openapi.yml")
        try:
            with open(openapi_path, "r") as file:
                openapi_spec = yaml.safe_load(file)
                return openapi_spec.get("info", {}).get("version", "Unknown")
        except FileNotFoundError:
            return f"OpenAPI spec file not found at {openapi_path}"
        except Exception as e:
            return f"Error reading openapi.yml: {str(e)}"

    def get(self):
        return jsonify({"version": self.get_api_version()})
