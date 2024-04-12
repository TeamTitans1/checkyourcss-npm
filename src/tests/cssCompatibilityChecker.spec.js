import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import { getCanIUseData } from "../cssCompatibilityChecker.js";

describe("CSS Compatibility Check", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("getCanIUseData", () => {
    it("should fetch Can I Use data", async () => {
      const mockData = { data: "test data" };
      sinon.stub(axios, "get").resolves({ data: mockData });

      const data = await getCanIUseData();
      expect(data).to.equal(mockData);
    });

    it("should handle errors gracefully", async () => {
      sinon.stub(axios, "get").rejects(new Error("Network error"));
      const consoleSpy = sinon.spy(console, "error");

      await getCanIUseData();
      expect(consoleSpy.calledOnce).to.be.true;
    });
  });
});
