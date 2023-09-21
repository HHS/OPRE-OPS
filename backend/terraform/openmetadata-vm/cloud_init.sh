#!/usr/bin/env bash

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages
sudo apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

cat <<EOF > ./docker-compose-extras.yml
version: "3.8"
services:
  db:
    image: mysql
    # NOTE: use of "mysql_native_password" is not recommended: https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password
    # (this is just an example, not intended to be a production configuration)
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_USER: ops
      MYSQL_PASSWORD: ops
      MYSQL_DATABASE: openmetadata
    networks:
      - es-net
    ports:
      - '3306:3306'
    expose:
      - '3306'
    volumes:
      - my-db:/var/lib/mysql

  elasticsearch:
    container_name: es-container
    image: docker.elastic.co/elasticsearch/elasticsearch:7.11.0
    environment:
      - xpack.security.enabled=false
      - "discovery.type=single-node"
    networks:
      - es-net
    ports:
      - 9200:9200

  kibana:
    container_name: kb-container
    image: docker.elastic.co/kibana/kibana:7.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://es-container:9200
    networks:
      - es-net
    depends_on:
      - elasticsearch
    ports:
      - 5601:5601

volumes:
  my-db:

networks:
  es-net:
    driver: bridge
EOF

# Install OpenMetadata Docker Compose
mkdir openmetadata-docker && cd openmetadata-docker || exit

# MySQL Configuration
echo -e "DB_USER=ops" > .env
echo -e "DB_USER_PASSWORD=ops" > .env
echo -e "DB_HOST=localhost" > .env
echo -e "DB_PORT=3306" > .env
echo -e "OM_DATABASE=openmetadata" > .env

# Elasticsearch Configuration for OpenMetadata
echo -e "ELASTICSEARCH_HOST=localhost" > .env
echo -e "ELASTICSEARCH_PORT=9200" > .env
echo -e "ELASTICSEARCH_SCHEME=" > .env
echo -e "ELASTICSEARCH_USER=elastic" > .env
echo -e "ELASTICSEARCH_PASSWORD=changeme" > .env

wget https://github.com/open-metadata/OpenMetadata/releases/download/1.1.5-release/docker-compose-openmetadata.yml

sudo docker compose up -d -f docker-compose-openmetadata.yml -f ../docker-compose-extras.yml
