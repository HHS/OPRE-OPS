from flask import Blueprint, abort, render_template
from jinja2 import TemplateNotFound

home = Blueprint("home", __name__, template_folder="templates")


@home.route("/")
def show():
    try:
        return render_template("index.html")
    except TemplateNotFound:
        abort(404)
