FROM python:3.9
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/local/

ENV PYTHONPATH=/opt/local/
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=opre_ops.django_config.settings.local

# Copy the Pipfile(s) only, so that we can cache dependencies
# in the next step
COPY ./Pipfile ./Pipfile.lock /opt/local/
RUN pip install --no-cache-dir --upgrade pip==22.2.2
RUN pip install --root-user-action=ignore --no-cache-dir pipenv==2022.7.24 && pipenv install --dev --system --deploy

# Now copy the rest of the app files, again to better support caching
# of prior steps.
COPY ./ /opt/local/

CMD ["python", "./opre_ops/manage.py", "runserver", "0.0.0.0:8080"]
