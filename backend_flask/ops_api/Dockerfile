FROM python:3.9-slim
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade pip==22.2.2 pipenv==2022.10.12 && useradd -ms /bin/bash app
USER app
WORKDIR /home/app

ENV PYTHONPATH=/home/app
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=ops
ENV FLASK_DEBUG=true
ENV FLASK_PORT=5001

# Copy the Pipfile(s) only, so that we can cache dependencies
# in the next step
COPY ./Pipfile ./Pipfile.lock /home/app/
RUN pipenv install --dev --system --deploy

# Now copy the rest of the app files, again to better support caching
# of prior steps.
COPY ./ /home/app/
USER root
RUN chown -R app:app .
USER app

CMD ["python", "-m", "flask", "run"]
