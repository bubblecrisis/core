/*
Copyright 2021 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

"use strict";

const { isFunction } = require("lodash");

class DefaultRoutesHandler {
  static get id() {
    return "default";
  }

  constructor(route, core) {
    this._method = route.method;
    this._url = route.url;
    this._response = route.response;
    this._variantId = route.variantId;
    this._core = core;
  }

  middleware(req, res, next) {
    if (isFunction(this._response)) {
      this._core.tracer.debug(
        `Route variant "${this._variantId}" response is a function, executing middleware | req: ${req.id}`
      );
      this._response(req, res, next, this._core);
    } else {
      this._core.tracer.debug(
        `Responding with route variant "${this._variantId}" | req: ${req.id}`
      );
      res.status(this._response.status);
      res.send(this._response.body);
    }
    this._core.tracer.info(`Request ${req.method} => ${req.url} => "${this._variantId}"`);
  }
}

module.exports = DefaultRoutesHandler;
