#!/usr/bin/env node

import fs from "fs";
import path from "path";
import postcss from "postcss";
import traverse from "@babel/traverse";
import autoprefixer from "autoprefixer";
import { parse } from "@babel/parser";
import { loadConfig } from "./configLoader.js";
import { selectBrowsersAndVersions } from "./userSelection.js";

function readFileContent(fullPath) {
  return fs.readFileSync(fullPath, "utf8");
}

function getCssText(fileContent) {
  const cssText = [];
  const ast = parse(fileContent, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });

  traverse.default(ast, {
    TaggedTemplateExpression(path) {
      const isStyledComponent =
        path.node.tag.type === "MemberExpression" &&
        path.node.tag.object.name === "styled";

      if (isStyledComponent) {
        path.node.quasi.quasis.forEach(element => {
          cssText.push(element.value.raw);
        });
      }
    },
  });

  return cssText;
}

function extractCssProperties(cssText) {
  const properties = [];

  cssText.forEach(text => {
    const cssProperties = text.split("\n");

    cssProperties.forEach(property => {
      const pattern = /([\w-]+)\s*:\s*([\w-]+)/g;
      const matches = property.match(pattern);
      if (matches) {
        properties.push(matches[0] + ";");
      }
    });
  });

  return properties;
}

async function addPrefixes(css, browserQuery) {
  const autoprefixerPlugin = autoprefixer({
    overrideBrowserslist: [browserQuery],
  });
  const processedCss = await postcss(autoprefixerPlugin).process(css, {
    from: undefined,
  });

  return processedCss.css;
}

async function getCssPolyfills(userSelections, content) {
  const result = userSelections.map(async selection => {
    const browserQuery = `${selection.browser} ${selection.version}`;
    const finalCss = await addPrefixes(content, browserQuery);
    const splittedCss = finalCss.split(";");
    const temp = [];

    for (let i = 1; i < splittedCss.length; i++) {
      if (
        splittedCss[i].includes("-webkit-") ||
        splittedCss[i].includes("-moz-") ||
        splittedCss[i].includes("-ms-") ||
        splittedCss[i].includes("-o-")
      ) {
        continue;
      } else {
        if (
          splittedCss[i - 1].includes("-webkit") ||
          splittedCss[i - 1].includes("-moz") ||
          splittedCss[i - 1].includes("-ms") ||
          splittedCss[i - 1].includes("-o-")
        ) {
          let j = i - 1;
          const info = { [splittedCss[i]]: [] };
          while (
            (splittedCss[j].includes("-webkit") ||
              splittedCss[j].includes("-moz") ||
              splittedCss[j].includes("-ms") ||
              splittedCss[j].includes("-o")) &&
            j >= 0
          ) {
            info[splittedCss[i]].push(splittedCss[j]);
            j--;
          }

          temp.push(info);
        }
      }
    }

    return temp;
  });

  return await Promise.all(result);
}

function modifyFileContent(results, fileContent) {
  results.flat().forEach(result => {
    const keys = Object.keys(result);

    keys.forEach(key => {
      if (result[key].length > 1) {
        const substitutionString = result[key]
          .map(value => value + ";")
          .join("\n");

        fileContent = fileContent.replace(
          new RegExp(key, "g"),
          match => `${substitutionString}\n  ${match}`,
        );
      } else {
        fileContent = fileContent.replace(
          new RegExp(key, "g"),
          match => `${result[key]};\n  ${match}`,
        );
      }
    });
  });

  return fileContent;
}

function getStyledComponentsFiles(currentPath, files) {
  const entries = fs.readdirSync(currentPath);

  for (const entry of entries) {
    if (
      entry === "node_modules" ||
      entry === "build" ||
      entry === "out" ||
      entry === "dist"
    ) {
      continue;
    }

    const filePath = path.join(currentPath, entry);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      getStyledComponentsFiles(filePath, files);
    } else {
      const fileContent = readFileContent(filePath);
      const styledComponentsRegex =
        /from ['"]styled-components(?:\/native)?['"]|require\(['"]styled-components(?:\/native)?['"]\)/;

      if (styledComponentsRegex.test(fileContent)) {
        files.push(filePath);
      }
    }
  }
}

async function changeStyledComponentsCss(filePath, userSelections) {
  if (filePath === ".") {
    const files = [];

    getStyledComponentsFiles(process.cwd(), files);

    const cssText = files.map(filePath => {
      const content = readFileContent(filePath);

      return getCssText(content);
    });
    const properties = [
      ...new Set(extractCssProperties(cssText.flat(Infinity))),
    ].join("");
    const results = await getCssPolyfills(userSelections, properties);

    files.forEach(file => {
      let fileContent = readFileContent(file);
      const modifiedContent = modifyFileContent(results, fileContent);

      fs.writeFileSync(file, modifiedContent);
    });
  } else if (/.*\..+$/.test(filePath)) {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = readFileContent(fullPath, "utf8");
    const cssText = getCssText(fileContent);
    const content = [...new Set(extractCssProperties(cssText))].join("");
    const results = await getCssPolyfills(userSelections, content);
    const modifiedContent = modifyFileContent(results, fileContent);

    fs.writeFileSync(fullPath, modifiedContent);
  }
}

async function changeToPolyfill() {
  const filePath = process.argv[3];
  const files = fs.readdirSync(process.cwd());
  const userConfig = await loadConfig();
  let configInfo;

  if (!Object.keys(userConfig).length) {
    configInfo = await selectBrowsersAndVersions();
  } else {
    configInfo = userConfig.browsers;
  }

  for (const file of files) {
    if (file === "package.json") {
      const fullPath = path.join(process.cwd(), file);
      const fileContent = fs.readFileSync(fullPath, "utf8");

      if (fileContent.includes('"styled-components"')) {
        changeStyledComponentsCss(filePath, configInfo);
      } else if (fileContent.includes("tailwindcss")) {
      }
    }
  }
}

changeToPolyfill();

export { changeToPolyfill };
