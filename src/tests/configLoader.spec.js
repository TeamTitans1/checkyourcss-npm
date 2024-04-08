import sinon from "sinon";
import { expect } from "chai";
import fs from "fs";
import { loadConfig } from "../configLoader.js";

describe("loadConfig function", () => {
  let existsSyncStub;
  let readFileSyncStub;

  beforeEach(() => {
    existsSyncStub = sinon.stub(fs, "existsSync");
    readFileSyncStub = sinon.stub(fs, "readFileSync");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return a config object if the config file exists", () => {
    existsSyncStub.returns(true);

    const mockConfig = {
      browsers: [
        {
          browser: "Chrome",
          version: "121",
        },
      ],
      compatibilityInfo: true,
      lineInfo: true,
    };

    readFileSyncStub.returns(JSON.stringify(mockConfig));

    const config = loadConfig();

    expect(config).to.deep.equal(mockConfig);
  });
});
