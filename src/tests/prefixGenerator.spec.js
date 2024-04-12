import { expect } from "chai";
import {
  getCssText,
  extractCssProperties,
  addPrefixes,
  getCssPolyfills,
  fixFileContent,
} from "../prefixGenerator.js";

describe("CSS Processing and Polyfill Application", () => {
  describe("getCssText", () => {
    it("should extract CSS text from file content", () => {
      const fileContent =
        "const styled = require('styled-components');\nconst Button = styled.button`background: red;`;";
      const cssText = getCssText(fileContent);

      expect(cssText).to.deep.equal(["background: red;"]);
    });
  });

  describe("extractCssProperties", () => {
    it("should extract CSS properties from CSS text", () => {
      const cssText = ["background: red;"];
      const properties = extractCssProperties(cssText);

      expect(properties).to.deep.equal(["background: red;"]);
    });
  });

  describe("addPrefixes", () => {
    it("should add prefixes to CSS properties based on browser query", async () => {
      const css = "display: flex;";
      const browserQuery = "last 2 versions";
      const prefixedCss = await addPrefixes(css, browserQuery);

      expect(prefixedCss).to.include("display: -webkit-box;");
      expect(prefixedCss).to.include("display: -ms-flexbox;");
      expect(prefixedCss).to.include("display: flex;");
    });
  });

  describe("getCssPolyfills", () => {
    it("should identify necessary CSS polyfills based on user selections", async () => {
      const userSelections = [{ browser: "chrome", version: "29" }];
      const content = "display: flex;";
      const results = await getCssPolyfills(userSelections, content);

      expect(results).to.satisfy(Array.isArray);
    });
  });

  describe("fixFileContent", () => {
    it("should replace CSS properties in file content with prefixed versions", () => {
      const results = [{ "display: flex;": ["display: -webkit-flex"] }];
      const fileContent = "const styles = `display: flex;`;";
      const newFileContent = fixFileContent(results, fileContent);

      expect(newFileContent).to.include("display: -webkit-flex;");
      expect(newFileContent).to.include("display: flex;");
    });
  });
});
