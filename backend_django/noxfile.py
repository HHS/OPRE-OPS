import nox

python_source = ["ops_api", "tests", "./noxfile.py", "./locustfile.py"]


@nox.session
def lint(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("flake8", *args, external=True)


@nox.session
def black(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("black", *args, external=True)


@nox.session
def locust(session):
    session.run("pipenv", "install", "--dev", external=True)

    session.run(
        "locust",
        "--headless",
        "--users",
        "125",
        "--spawn-rate",
        "5",
        "--run-time",
        "10m",
        "--stop-timeout",
        "10",
        "--host",
        "http://localhost:8080",
        external=True,
    )
