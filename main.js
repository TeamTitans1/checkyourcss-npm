#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { getTailwindCss } from "./tailwindCss.js";
import { checkCssCompatibility } from "./cssCompatibility.js";
import { getStyledComponentsCss } from "./styledComponents.js";
import { selectBrowsersAndVersions } from "./userSelection.js";
import { renderResult } from "./result.js";
import chalk from "chalk";
import figlet from "figlet";

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
  const resultToShow = renderResult(userSelections, result);

  figlet(
    "Check Your CSS",
    {
      font: "slant",
    },
    function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
      }
      // 아스키 아트에 색상 적용
      console.log(chalk.redBright.bold(data));
      Object.values(resultToShow).forEach(notSupport => {
        console.log(`Property: ${notSupport.property}`);
        notSupport.lines.forEach(line => {
          console.log(`Used At: ${line}`);
        });

        notSupport.notices.forEach(notice => {
          console.log(`Compatibility: ${notice}`);
        });

        console.log(" ");
      });
    },
  );
}

main();
