FROM python:3.9.6
ENV PYTHONUNBUFFERED=1
WORKDIR /opre_project
COPY requirements.txt /opre_project/
RUN pip install -r requirements.txt
COPY ./opre_ops/ /opre_project/