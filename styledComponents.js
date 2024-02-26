import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

function findStyledVariableNames(fileContents) {
  const ast = parse(fileContents, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });
  const imports = [];

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "styled-components") {
        path.node.specifiers.forEach(specifier => {
          if (specifier.type === "ImportDefaultSpecifier") {
            imports.push(specifier.local.name);
          } else if (specifier.type === "ImportSpecifier") {
            imports.push(specifier.imported.name);
          }
        });
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.init &&
        path.node.init.callee &&
        path.node.init.callee.name === "require" &&
        path.node.init.arguments &&
        path.node.init.arguments.length > 0 &&
        path.node.init.arguments[0].value === "styled-components"
      ) {
        imports.push(path.node.id.name);
      }
    },
  });

  return imports;
}

function extractStyledComponentsCSS(fileContents, styledVariableNames) {
  if (!styledVariableNames) {
    return;
  }

  const ast = parse(fileContents, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });

  const cssProperties = new Set();

  styledVariableNames.forEach(styledVariableName => {
    traverse.default(ast, {
      TaggedTemplateExpression(path) {
        const tagPath = path.get("tag");

        if (tagPath.isCallExpression()) {
          const calleeName = tagPath.get("callee").node.name;

          if (styledVariableName.includes(calleeName)) {
            extractCSSProperties(path, cssProperties);
          }
        } else if (
          tagPath.isMemberExpression() &&
          tagPath.get("object").node.name &&
          styledVariableName.includes(tagPath.get("object").node.name)
        ) {
          extractCSSProperties(path, cssProperties);
        } else if (
          tagPath.isIdentifier() &&
          styledVariableName.includes(tagPath.node.name)
        ) {
          extractCSSProperties(path, cssProperties);
        }
      },
    });
  });

  return Array.from(cssProperties);
}

function extractCSSProperties(path, cssProperties) {
  path
    .get("quasi")
    .get("quasis")
    .forEach(quasiPath => {
      const cssText = quasiPath.node.value.raw;
      const startLine = quasiPath.node.loc.start.line;
      const regex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
      let match;

      while ((match = regex.exec(cssText))) {
        const declaratives = match[0];
        const property = match[1];
        const lineOffset = calculateLineOffset(
          cssText.substring(0, match.index),
        );
        const propertyLine = startLine + lineOffset;

        cssProperties.add({
          property,
          line: propertyLine,
          declaratives,
        });
      }
    });
}

function calculateLineOffset(text) {
  return (text.match(/\n/g) || []).length;
}

function getStyledComponentsCss(directoryPath, styledComponentsCss) {
  const filesInDirectory = fs.readdirSync(directoryPath);
  for (const file of filesInDirectory) {
    if (
      file === "node_modules" ||
      file === "build" ||
      file === "out" ||
      file === "dist"
    ) {
      continue;
    }

    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);
    let cssProperties;

    if (stats.isDirectory()) {
      getStyledComponentsCss(filePath, styledComponentsCss);
    } else {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const styledComponentsRegex =
        /from ['"]styled-components(?:\/native)?['"]|require\(['"]styled-components(?:\/native)?['"]\)/;

      if (styledComponentsRegex.test(fileContents)) {
        const styledVariableNames = findStyledVariableNames(fileContents);

        cssProperties = extractStyledComponentsCSS(
          fileContents,
          styledVariableNames,
        );

        cssProperties = cssProperties.map(info => {
          return {
            property: info.property,
            line: `${filePath}:${info.line}`,
            declaratives: { decl: info.declaratives },
          };
        });
      }

      if (cssProperties && cssProperties.length > 0) {
        styledComponentsCss.push({
          filePath: filePath,
          cssProperties: cssProperties,
        });
      }
    }
  }

  return styledComponentsCss;
}

export { getStyledComponentsCss };
