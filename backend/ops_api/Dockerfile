FROM python:3.10-slim
# hadolint ignore=DL3008
RUN apt-get update && apt-get -y install curl --no-install-recommends && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade pip==22.2.2 pipenv==2022.10.12 && useradd -ms /bin/bash app
WORKDIR /home/app


# Copy the Pipfile(s) only, so that we can cache dependencies
# in the next step
COPY ./Pipfile ./Pipfile.lock /home/app/
RUN pipenv install --dev --system --deploy

# Now copy the rest of the app files, again to better support caching
# of prior steps.
COPY ./ /home/app/

RUN chown -R app:app .
USER app

ENV PYTHONPATH=/home/app
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=ops
ENV FLASK_DEBUG=true

CMD ["python", "-m", "gunicorn", "-b", ":8080", "ops:create_app()"]
