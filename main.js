#!/usr/bin/env node
import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";
import { loadConfig } from "./configLoader.js";
import { createConfig } from "./create-config.js";
import { renderResult } from "./result.js";
import { getTailwindCss } from "./tailwindCss.js";
import { changeToPolyfill } from "./polyfill.js";
import { checkCssCompatibility } from "./cssCompatibility.js";
import { getStyledComponentsCss } from "./styledComponents.js";
import { selectBrowsersAndVersions } from "./userSelection.js";

const currentPath = process.cwd();
const args = process.argv.slice(2);

if (args.includes("--init")) {
  createConfig();
} else if (args.includes("--fix")) {
  changeToPolyfill();
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
      } else {
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
        let message = chalk.bold(
          `${chalk.redBright("[Warning]")} ${chalk.greenBright.italic(notSupport.property)} is not supported in ${notSupport.notices}.`,
        );

        message += "\n\n" + chalk.yellow("[Suggestion]") + "\n";
        notSupport.suggestion.forEach(item => {
          if (!item.includes(":")) {
            message += `• ${item}:\n`;
          } else {
            message += `    ${item}\n`;
          }
        });

        message += "\n" + chalk.blueBright("[Used At]") + "\n";
        notSupport.lines.forEach(line => {
          message += `• ${line}\n`;
        });

        console.log(
          boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "white",
            backgroundColor: "black",
            title: `${notSupport.property}`,
          }),
        );
        console.log(" ");
      });
    },
  );
}
