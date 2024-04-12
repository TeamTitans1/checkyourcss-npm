import { expect } from "chai";
import { renderResult } from "../resultGenerator.js";

describe("renderResult Function Extended Tests", () => {
  it("should handle empty user selections and results gracefully", () => {
    const userSelections = [];
    const result = [];
    const output = renderResult(userSelections, result);
    expect(output).to.be.an("object").that.is.empty;
  });
});
