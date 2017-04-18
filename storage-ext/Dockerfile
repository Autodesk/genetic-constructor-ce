FROM phusion/baseimage:0.9.19
MAINTAINER drew.hylbert@autodesk.com # 2016-08-17

# Dependencies
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y wget curl g++ g++-multilib libgc-dev git python build-essential
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get -y install nodejs
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g format-json-log

ENV APP /app
RUN mkdir -p $APP
WORKDIR $APP

#Only install npm packages if the package.json changes
ADD ./package.json $APP/package.json
RUN npm install

COPY . $APP/

CMD npm run server
