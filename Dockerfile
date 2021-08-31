FROM python:3.9.6
ENV PYTHONUNBUFFERED=1
WORKDIR /opre_project
COPY Pipfile Pipfile.lock /opre_project/
RUN pip install --upgrade pip pipenv && pipenv install --dev --system --deploy
COPY ./opre_ops/ /opre_project/