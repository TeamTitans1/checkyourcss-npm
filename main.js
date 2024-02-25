#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { getTailwindCss } from "./tailwindCss.js";
import { checkCssCompatibility } from "./cssCompatibility.js";
import { getStyledComponentsCss } from "./styledComponents.js";
import { selectBrowsersAndVersions } from "./userSelection.js";
import { loadConfig } from "./configLoader.js";
import { createConfig } from "./create-config.js";
import { renderResult } from "./result.js";
import chalk from "chalk";
import figlet from "figlet";

const currentPath = process.cwd();
const args = process.argv.slice(2);

if (args.includes("--init")) {
  createConfig();
} else {
  main();
}

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
  const userConfig = await loadConfig();
  let configInfo;

  if (!Object.keys(userConfig).length) {
    configInfo = await selectBrowsersAndVersions();
  } else {
    configInfo = userConfig.browsers;
  }

  const cssInfo = await getUserCssData();
  const result = await checkCssCompatibility(cssInfo, configInfo);
  const resultToShow = renderResult(configInfo, result);

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

      console.log(chalk.redBright.bold(data));
      Object.values(resultToShow).forEach(notSupport => {
        console.log(
          chalk.yellow.bold.italic(`Property: ${notSupport.property}`),
        );

        if (!Object.keys(userConfig).length) {
          notSupport.lines.forEach(line => {
            console.log(`Used At: ${line}`);
          });
          notSupport.notices.forEach(notice => {
            console.log(
              chalk.underline.whiteBright(`Compatibility: ${notice}`),
            );
          });
        } else {
          if (userConfig.lineInfo) {
            notSupport.lines.forEach(line => {
              console.log(`Used At: ${line}`);
            });
          }

          if (userConfig.compatibilityInfo) {
            notSupport.notices.forEach(notice => {
              console.log(
                chalk.underline.whiteBright(`Compatibility: ${notice}`),
              );
            });
          }
        }

        console.log(" ");
      });
    },
  );
}
