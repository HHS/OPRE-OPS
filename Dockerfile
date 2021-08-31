FROM python:3.9.6
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=opre_ops.settings.local
WORKDIR /opre_project
COPY Pipfile Pipfile.lock /opre_project/
RUN pip install --upgrade pip pipenv && pipenv install --dev --system --deploy
COPY ./opre_ops/ /opre_project/