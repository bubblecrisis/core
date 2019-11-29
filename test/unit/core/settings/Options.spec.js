/*
Copyright 2019 Javier Brea
Copyright 2019 XbyOrange

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

const sinon = require("sinon");

const CommandLineArgumentsMocks = require("./CommandLineArguments.mocks.js");

const Options = require("../../../../src/settings/Options");
const tracer = require("../../../../src/tracer");

describe("options", () => {
  let sandbox;
  let options;
  let commandLineArgumentsMocks;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.spy(tracer, "warn");
    sandbox.stub(tracer, "error");
    commandLineArgumentsMocks = new CommandLineArgumentsMocks();
    options = new Options();
  });

  afterEach(() => {
    sandbox.restore();
    commandLineArgumentsMocks.restore();
  });

  describe("init method", () => {
    it("should call to get command line arguments", async () => {
      await options.init();
      expect(commandLineArgumentsMocks.stubs.instance.init.callCount).toEqual(1);
    });

    it("should call only once to get command line arguments", async () => {
      await options.init();
      await options.init();
      await options.init();
      expect(commandLineArgumentsMocks.stubs.instance.init.callCount).toEqual(1);
    });

    it("should print a warning if --feature option is received", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        feature: "foo-feature",
        cli: true,
        behaviors: "foo/features/path"
      };
      await options.init();
      expect(tracer.warn.getCall(0).args[0]).toEqual(
        expect.stringContaining("Deprecation warning: --feature")
      );
    });

    it("should print a warning if --features option is received", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        cli: true,
        features: "foo/features/path"
      };
      await options.init();
      expect(tracer.warn.getCall(0).args[0]).toEqual(
        expect.stringContaining("Deprecation warning: --features")
      );
    });
  });

  describe("init method when using programmatic options", () => {
    it("should not call to get command line arguments", async () => {
      options = new Options({
        onlyProgrammaticOptions: true
      });
      await options.init();
      expect(commandLineArgumentsMocks.stubs.instance.init.callCount).toEqual(0);
    });
  });

  describe("when adding custom option", () => {
    it("should trow an error if options have been already initialized", async () => {
      expect.assertions(2);
      await options.init();
      try {
        options.addCustom();
      } catch (error) {
        const errorMessageContains = "already initializated";
        expect(tracer.error.getCall(0).args[0]).toEqual(
          expect.stringContaining(errorMessageContains)
        );
        expect(error.message).toEqual(expect.stringContaining(errorMessageContains));
      }
    });

    it("should trow an error if no option is provided", () => {
      expect.assertions(2);
      try {
        options.addCustom();
      } catch (error) {
        const errorMessageContains = "provide option details";
        expect(tracer.error.getCall(0).args[0]).toEqual(
          expect.stringContaining(errorMessageContains)
        );
        expect(error.message).toEqual(expect.stringContaining(errorMessageContains));
      }
    });

    it("should trow an error if option name is not provided", () => {
      expect.assertions(2);
      try {
        options.addCustom({
          description: "foo"
        });
      } catch (error) {
        const errorMessageContains = "provide option name";
        expect(tracer.error.getCall(0).args[0]).toEqual(
          expect.stringContaining(errorMessageContains)
        );
        expect(error.message).toEqual(expect.stringContaining(errorMessageContains));
      }
    });

    it("should trow an error if option was already declared", () => {
      expect.assertions(2);
      try {
        options.addCustom({
          name: "behaviors"
        });
      } catch (error) {
        const errorMessageContains = "already registered";
        expect(tracer.error.getCall(0).args[0]).toEqual(
          expect.stringContaining(errorMessageContains)
        );
        expect(error.message).toEqual(expect.stringContaining(errorMessageContains));
      }
    });

    it("should trow an error if option type is unknown", () => {
      expect.assertions(2);
      try {
        options.addCustom({
          name: "foo",
          type: "foo"
        });
      } catch (error) {
        const errorMessageContains = "provide a valid option type";
        expect(tracer.error.getCall(0).args[0]).toEqual(
          expect.stringContaining(errorMessageContains)
        );
        expect(error.message).toEqual(expect.stringContaining(errorMessageContains));
      }
    });

    it("should print a warning if option description is not provided", () => {
      expect.assertions(1);
      options.addCustom({
        name: "foo",
        type: "string"
      });
      const errorMessageContains = "provide option description";
      expect(tracer.warn.getCall(0).args[0]).toEqual(
        expect.stringContaining(errorMessageContains)
      );
    });

    it("should not print a warning if option description is not provided", () => {
      expect.assertions(1);
      options.addCustom({
        name: "foo",
        type: "string",
        description: "foo-description"
      });
      expect(tracer.warn.callCount).toEqual(0);
    });
  });

  describe("options getter", () => {
    it("should only get values from keys defined in default values", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined,
        foo2: "foooo"
      };
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should remove deprecated options", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined,
        foo2: "foooo",
        recursive: false
      };
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should get values from keys defined in new options", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: "foo"
      };
      options.addCustom({
        name: "cli",
        type: "boolean"
      });
      options.addCustom({
        name: "foo",
        type: "string"
      });
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        cli: true,
        foo: "foo",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should extend default options with user options, ommiting undefined values", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined
      };
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should convert feature and features options to behavior and behaviors", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        feature: "foo-feature",
        cli: true,
        features: "foo/features/path"
      };
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-feature",
        behaviors: "foo/features/path"
      });
    });

    it("should apply behavior and behavior options if feature and features options are received too", async () => {
      commandLineArgumentsMocks.stubs.instance.options = {
        behavior: "foo-behavior",
        feature: "foo-feature",
        cli: true,
        behaviors: "foo/behaviors/path",
        features: "foo-feature"
      };
      await options.init();
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });
  });

  describe("options getter when using programmatic options", () => {
    beforeEach(() => {
      options = new Options({
        onlyProgrammaticOptions: true
      });
    });

    it("should only get values from keys defined in default values", async () => {
      await options.init({
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined,
        foo2: "foooo"
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should remove deprecated options", async () => {
      await options.init({
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined,
        foo2: "foooo",
        recursive: false
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should get values from keys defined in new options", async () => {
      options.addCustom({
        name: "cli",
        type: "boolean"
      });
      options.addCustom({
        name: "foo",
        type: "string"
      });
      await options.init({
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: "foo"
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        cli: true,
        foo: "foo",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should extend default options with user options, ommiting undefined values", async () => {
      await options.init({
        behavior: "foo-behavior",
        cli: true,
        behaviors: "foo/behaviors/path",
        foo: undefined
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });

    it("should convert feature and features options to behavior and behaviors", async () => {
      await options.init({
        feature: "foo-feature",
        cli: true,
        features: "foo/features/path"
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-feature",
        behaviors: "foo/features/path"
      });
    });

    it("should apply behavior and behavior options if feature and features options are received too", async () => {
      await options.init({
        behavior: "foo-behavior",
        feature: "foo-feature",
        cli: true,
        behaviors: "foo/behaviors/path",
        features: "foo-feature"
      });
      expect(options.options).toEqual({
        port: 3100,
        host: "0.0.0.0",
        log: "info",
        delay: 0,
        watch: true,
        behavior: "foo-behavior",
        behaviors: "foo/behaviors/path"
      });
    });
  });

  describe("getValidOptionName method", () => {
    it("should throw an error if option is not valid", async () => {
      expect.assertions(1);
      await options.init();
      try {
        options.getValidOptionName("foo");
      } catch (error) {
        expect(error.message).toEqual(expect.stringContaining("Not valid option"));
      }
    });

    it("should return option name if option is valid", async () => {
      await options.init();
      expect(options.getValidOptionName("behavior")).toEqual("behavior");
    });

    it("should return new option name if option is deprecated", async () => {
      expect.assertions(2);
      await options.init();
      const option = options.getValidOptionName("feature");
      expect(
        tracer.warn.calledWith(
          "Deprecation warning: feature option will be deprecated. Use behavior instead"
        )
      ).toEqual(true);
      expect(option).toEqual("behavior");
    });

    it("should return true if option is custom option", async () => {
      options.addCustom({
        name: "foo",
        type: "boolean"
      });
      await options.init();
      expect(options.getValidOptionName("foo")).toEqual("foo");
    });
  });
});