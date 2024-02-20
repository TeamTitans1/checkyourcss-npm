import os from "os";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import { execSync } from "child_process";

function copyFiles(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      [
        "node_modules",
        ".DS_Store",
        ".git",
        ".github",
        "dist",
        "build",
        "out",
      ].includes(entry.name)
    ) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyFiles(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function findBuildDirectory(directoryPath) {
  const entries = fs.readdirSync(directoryPath);
  const buildDirectory = entries.find(entry =>
    ["build", "out", "dist"].includes(entry),
  );

  return path.join(directoryPath, buildDirectory);
}

function traverseDirectory(directoryPath, callback) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      traverseDirectory(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function getCssFilePath(directoryPath) {
  let cssFilePath = "";

  traverseDirectory(directoryPath, filePath => {
    if (filePath.endsWith(".css")) {
      cssFilePath = filePath;
    }
  });

  return cssFilePath;
}

async function getTailwindCssProperties() {
  const tempDir = path.join(os.tmpdir(), "build-folder");

  copyFiles(process.cwd(), tempDir);
  process.chdir(tempDir);
  execSync("npm install; npm run build");

  const buildDirectoryPath = findBuildDirectory(process.cwd());
  const cssFilePath = getCssFilePath(buildDirectoryPath);
  const css = fs.readFileSync(cssFilePath, "utf8");

  try {
    const result = await postcss().process(css, { from: cssFilePath });
    const cssProperties = [];
    const root = result.root;

    root.walkDecls(decl => {
      if (decl.parent.selector.startsWith(".")) {
        cssProperties.push({ [decl.prop]: decl.parent.selector });
      }
    });

    return cssProperties;
  } catch (err) {
    console.error(err);
  }

  return cssPropertiesAndTwInfo;
}

function parseFileToAST(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  return parse(fileContent, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
}

function extractTailwindClasses(filePath) {
  const ast = parseFileToAST(filePath);
  const tailwindClasses = new Set();

  traverse.default(ast, {
    JSXAttribute({ node }) {
      if (node.name.name === "className") {
        if (node.value.type === "StringLiteral") {
          node.value.value.split(" ").forEach(className =>
            tailwindClasses.add({
              className: className,
              path: `${filePath}:${node.value.loc.start.line}`,
            }),
          );
        } else if (
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression.type === "StringLiteral"
        ) {
          node.value.expression.value
            .split(" ")
            .forEach(className => tailwindClasses.add(className));
        }
      }
    },
  });

  return [...tailwindClasses];
}

function extractTailwindClassesFromDirectory(
  directoryPath,
  pathAndTailwindClasses,
) {
  const files = fs.readdirSync(directoryPath);

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
      if (!filePath.includes("node_modules")) {
        const tailwindClasses = extractTailwindClasses(filePath);

        if (tailwindClasses.length > 0) {
          pathAndTailwindClasses.push({
            filePath: filePath,
            tailwindClasses: [...tailwindClasses],
          });
        }
      }
    } else if (stats.isDirectory()) {
      extractTailwindClassesFromDirectory(filePath, pathAndTailwindClasses);
    }
  });

  return pathAndTailwindClasses;
}

function createCssInfo(pathAndTailwindClasses, cssPropertiesAndTwInfo) {
  pathAndTailwindClasses.forEach(info => {
    const cssProperties = new Set();
    info.cssMatching = [];
    info.cssProperties = [];

    info.tailwindClasses.forEach(tailwindClass => {
      cssPropertiesAndTwInfo.forEach(item => {
        const cssPropertyName = Object.keys(item)[0];
        const cssPropertyValue = item[cssPropertyName];

        if (
          cssPropertyValue.includes(tailwindClass.className) &&
          !cssPropertyName.includes("--tw-")
        ) {
          info.cssMatching.push({ [cssPropertyName]: tailwindClass.className });
          info.cssProperties.push({
            property: cssPropertyName,
            line: tailwindClass.path,
          });
          cssProperties.add(cssPropertyName);
        }
      });
    });
  });
}

async function getTailwindCss(projectDirectory) {
  const pathAndTailwindClasses = [];

  const cssPropertiesAndTwInfo = await getTailwindCssProperties();

  extractTailwindClassesFromDirectory(projectDirectory, pathAndTailwindClasses);
  createCssInfo(pathAndTailwindClasses, cssPropertiesAndTwInfo);

  return pathAndTailwindClasses;
}

export { getTailwindCss };
