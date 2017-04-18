# Inherit from ubuntu docker image
FROM node:boron

MAINTAINER bionanodevops@autodesk.com # 2016-12-13

ENV CXX g++-4.9
RUN apt-get dist-upgrade -y
RUN apt-get update -y
RUN apt-get upgrade -y

RUN apt-get install -y software-properties-common
RUN apt-get install -y curl git build-essential wget
RUN apt-get install -y python python-dev python-pip
RUN pip install awscli
RUN pip install biopython

RUN	apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /app
WORKDIR /app

#setup node
ADD package.json /app/package.json
ADD storage-ext /app/storage-ext
RUN npm install

ADD . /app

#install extensions, continue even if errors
RUN npm run install-extensions || true

# add docs, even if package.json hasnt changed
RUN npm run jsdoc

RUN cd /app

# Redis now launch via docker-compose and is referenced via link
CMD  ["npm" , "run", "start-instance"]
