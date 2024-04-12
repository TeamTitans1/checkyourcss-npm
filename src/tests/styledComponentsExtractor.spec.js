import { expect } from "chai";
import { describe, it } from "mocha";
import {
  findStyledVariableNames,
  extractStyledComponentsCSS,
} from "../styledComponentsExtractor.js";

describe("findStyledVariableNames", () => {
  it("Should return the correct variable name", () => {
    const fileContents = `
      import styled from 'styled-components';
      const Button = styled.button\`\`;
    `;

    const variableNames = findStyledVariableNames(fileContents);
    expect(variableNames).to.include("styled");
  });
});

describe("extractStyledComponentsCSS", () => {
  it("Should correctly extract CSS properties from styled components", () => {
    const fileContents = `
      import styled from 'styled-components';
      const Button = styled.button\`
        font-size: 16px;
        color: blue;
      \`;
    `;
    const styledVariableNames = ["styled"];
    const result = extractStyledComponentsCSS(
      fileContents,
      styledVariableNames,
    );
    expect(result).to.deep.include.members([
      { property: "font-size", line: 4, declaratives: "font-size: 16px;" },
      { property: "color", line: 5, declaratives: "color: blue;" },
    ]);
  });
});
