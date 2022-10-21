all: run

clean:
	rm -rf venv build dist .pytest_cache .mypy_cache *.egg-info

venv:
	pipenv shell

run: venv
	FLASK_APP=ops_api FLASK_DEBUG=true flask run

format: venv
	venv/bin/black . && venv/bin/isort .

format-check: venv
	venv/bin/black --check . && venv/bin/isort --check .

lint:
	pipenv run flake8 .

mypy: venv
	venv/bin/mypy

test: venv
	FLASK_ENV=development venv/bin/pytest

dist: venv format-check lint mypy test
	venv/bin/pip wheel --wheel-dir dist --no-deps .
