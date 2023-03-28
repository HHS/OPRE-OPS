FROM debian:stable-slim

LABEL "com.github.actions.name"="Cloud.gov Cloud Foundry CLI"
LABEL "com.github.actions.description"="Deploy and Manage Cloud.gov services using the latest version of the cf cli"
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="green"

RUN apt-get update
RUN apt-get install -y ca-certificates
# RUN curl -sSL https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
RUN echo "deb [trusted=yes] https://packages.cloudfoundry.org/debian stable main" > /etc/apt/sources.list.d/cloudfoundry-cli.list
RUN apt-get update
RUN apt-get install -y cf8-cli

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
