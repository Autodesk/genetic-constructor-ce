"use strict";

// defaults look to the docker-machine on OSX
var config = {
  host: 'localhost',
  port: '5432',
  user: 'storage',
  password: 'storageGCTOR',
  database: 'storage'
};

if (process.env.PGHOST != null) {
  config.host = process.env.PGHOST;
}
if (process.env.PGPORT != null) {
  config.port = parseInt(process.env.PGPORT, 10);
}
if (process.env.PGUSER != null) {
  config.user = process.env.PGUSER;
}
if (process.env.PGPASSWORD != null) {
  config.password = process.env.PGPASSWORD;
}
if (process.env.PGDATABASE != null) {
  config.database = process.env.PGDATABASE;
}

function generateConnectString(config) {
  //'postgres://user:pass@example.com:5432/dbname'
  var pgConnString = 'postgres://' + config.user + ':' + config.password + '@' + config.host + ':' + config.port + '/'
    + config.database;

  //support for HEROKU
  if (process.env.DATABASE_URL) {
    pgConnString = process.env.DATABASE_URL;
  }

  console.log("pgConnString", pgConnString);
  return pgConnString;
}

module.exports = config;
module.exports.connectString = generateConnectString(config);