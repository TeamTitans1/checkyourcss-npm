#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { getStyledComponentsCss } from "./styledComponents.js";

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
      } else {
      }
    }
  }
  console.log(cssInfo);

  return cssInfo;
}

async function main() {
  const cssInfo = await getUserCssData();
}

main();
