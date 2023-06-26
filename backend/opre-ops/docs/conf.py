"""Sphinx configuration."""
project = "OPRE-OPS"
author = "Tim Donaworth"
copyright = "2023, Tim Donaworth"
extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx_click",
    "myst_parser",
]
autodoc_typehints = "description"
html_theme = "furo"
