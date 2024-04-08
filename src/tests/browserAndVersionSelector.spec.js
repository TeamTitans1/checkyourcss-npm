import axios from "axios";
import sinon from "sinon";
import inquirer from "inquirer";
import AxiosMockAdapter from "axios-mock-adapter";
import { expect } from "chai";
import {
  selectBrowsersAndVersions,
  getCanIUseData,
} from "../browserAndVersionSelector.js";

describe("getCanIUseData", function () {
  it("Should fetch data from the caniuse API", async function () {
    const axiosMock = new AxiosMockAdapter(axios);
    const mockData = { agents: { chrome: { version_list: [] } } };

    axiosMock
      .onGet(
        "https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json",
      )
      .reply(200, mockData);

    const data = await getCanIUseData();

    expect(data).to.deep.equal(mockData);

    axiosMock.restore();
  });

  it("Should handle an error if the API call fails", async function () {
    const axiosMock = new AxiosMockAdapter(axios);

    axiosMock
      .onGet(
        "https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json",
      )
      .networkError();

    const consoleSpy = sinon.spy(console, "error");

    await getCanIUseData();

    expect(consoleSpy.calledOnce).to.be.true;

    consoleSpy.restore();
    axiosMock.restore();
  });
});

describe("selectBrowsersAndVersions", function () {
  const mockData = {
    agents: {
      chrome: { version_list: [{ version: "88" }] },
      firefox: { version_list: [{ version: "85" }] },
      safari: { version_list: [{ version: "14" }] },
      edge: { version_list: [{ version: "89" }] },
      opera: { version_list: [{ version: "74" }] },
      samsung: { version_list: [{ version: "13" }] },
      and_chr: { version_list: [{ version: "88" }] },
      android: { version_list: [{ version: "11" }] },
      ios_saf: { version_list: [{ version: "14" }] },
      and_ff: { version_list: [{ version: "85" }] },
    },
  };

  afterEach(() => {
    sinon.restore();
  });

  it("Should allow user to select a browser and version", async () => {
    sinon.stub(axios, "get").resolves({ data: mockData });
    sinon
      .stub(inquirer, "prompt")
      .onFirstCall()
      .resolves({ selectedBrowsers: ["Chrome"] })
      .onSecondCall()
      .resolves({ selectedVersion: "88" });

    const selections = await selectBrowsersAndVersions();

    expect(selections).to.deep.equal([{ browser: "Chrome", version: "88" }]);
  });

  it("Should allow user to select multiple browsers and versions", async () => {
    sinon.stub(axios, "get").resolves({ data: mockData });
    sinon
      .stub(inquirer, "prompt")
      .onFirstCall()
      .resolves({ selectedBrowsers: ["Chrome", "FireFox"] })
      .onSecondCall()
      .resolves({ selectedVersion: "88" })
      .onThirdCall()
      .resolves({ selectedVersion: "85" });

    const selections = await selectBrowsersAndVersions();

    expect(selections).to.deep.equal([
      { browser: "Chrome", version: "88" },
      { browser: "FireFox", version: "85" },
    ]);
  });
});
