FROM python:3.9-slim
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade pip==22.2.2 pipenv==2022.7.24 && useradd -ms /bin/bash app
USER app
WORKDIR /home/app

ENV PYTHONPATH=/home/app
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=opre_ops.django_config.settings.local

# Copy the Pipfile(s) only, so that we can cache dependencies
# in the next step
COPY ./Pipfile ./Pipfile.lock /home/app/
RUN pipenv install --dev --system --deploy

# Now copy the rest of the app files, again to better support caching
# of prior steps.
COPY ./ /home/app/

CMD ["uvicorn", "opre_ops.django_config.asgi:application"]
