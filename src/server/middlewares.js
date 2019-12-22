/*
Copyright 2019 Javier Brea
Copyright 2019 XbyOrange

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

"use strict";

const bodyParser = require("body-parser");
const Boom = require("@hapi/boom");
const cors = require("cors");
const expressRequestId = require("express-request-id");

const tracer = require("../tracer");

const addRequestId = expressRequestId();
const jsonBodyParser = bodyParser.json();
const enableCors = cors();

const addCommonHeaders = (req, res, next) => {
  res.header("Accept-Encoding", "gzip, deflate, br");
  res.header("Accept-Language", "es-ES,es;q=0.9,en;q=0.8,la;q=0.7,fr;q=0.6"); // TODO, remove harcoded language headers
  next();
};

const traceRequest = (req, res, next) => {
  tracer.verbose(`Request received | ${req.method} => ${req.url} | Assigned id: ${req.id}`);
  next();
};

const notFound = (req, res, next) => {
  tracer.debug(`Sending Not found response | ${req.id}`);
  next(Boom.notFound());
};

const errorHandler = (err, req, res, next) => {
  const isBoom = Boom.isBoom(err);
  const stack = isBoom ? null : err && err.stack;
  const error = isBoom ? err : err && Boom.badImplementation(err);
  if (error) {
    tracer.error(`Sending Error "${error.message}" | ${req.id}`);
    if (stack) {
      tracer.silly(stack.toString());
    }
    res.status(error.output.statusCode);
    res.send(error.output.payload);
  } else {
    next();
  }
};

module.exports = {
  addRequestId,
  jsonBodyParser,
  traceRequest,
  enableCors,
  addCommonHeaders,
  notFound,
  errorHandler
};
