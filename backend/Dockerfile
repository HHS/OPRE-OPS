FROM python:3.9
RUN apt-get update && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/local/

COPY ./ /opt/local/

ENV PYTHONPATH=/opt/local/
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=opre_ops.django_config.settings.local

RUN pip install --no-cache-dir --upgrade pip==22.2 pipenv==2022.7.24 && pipenv install --dev --system --deploy

CMD ["python", "./opre_ops/manage.py", "runserver", "0.0.0.0:8080"]
