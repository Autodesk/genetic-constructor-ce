#!/usr/bin/env node
"use strict";

var urlSafeBase64 = require("urlsafe-base64");

if (!process.argv[2]) {
  console.error("provide a string to encode");
  process.exit(1);
}

var inputBuffer = new Buffer(process.argv[2], 'utf8');
console.log(urlSafeBase64.encode(inputBuffer));
process.exit(0);
