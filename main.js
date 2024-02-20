#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { getTailwindCss } from "./tailwindCss.js";
import { checkCssCompatibility } from "./cssCompatibility.js";
import { getStyledComponentsCss } from "./styledComponents.js";
import { selectBrowsersAndVersions } from "./userSelection.js";

const currentPath = process.cwd();

async function getUserCssData() {
  const cssInfo = [];
  const filesInDirectory = fs.readdirSync(currentPath);

  for (const file of filesInDirectory) {
    if (file === "package.json") {
      const filePath = path.join(currentPath, file);
      const fileContents = fs.readFileSync(filePath, "utf8");

      if (fileContents.includes('"styled-components"')) {
        getStyledComponentsCss(currentPath, cssInfo);
      } else if (fileContents.includes("tailwindcss")) {
        cssInfo.push(...(await getTailwindCss(currentPath)));
      }
    }
  }

  return cssInfo;
}

async function main() {
  const userSelections = await selectBrowsersAndVersions();
  const cssInfo = await getUserCssData();
  const result = await checkCssCompatibility(cssInfo, userSelections);
}

main();
