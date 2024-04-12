import chalk from "chalk";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

function renderResult(userSelections, result) {
  const resultToShow = {};

  userSelections.forEach(selection => {
    result.forEach(propertyInfo => {
      if (propertyInfo[selection.browser]) {
        propertyInfo[selection.browser].compatibilityMessage =
          `${selection.browser} ${propertyInfo[selection.browser].versionsSupport[0]} and higher`;
      }
    });
  });

  userSelections.forEach(selection => {
    result.forEach(propertyInfo => {
      const browserInfo = propertyInfo[selection.browser];

      if (!browserInfo || browserInfo.compatibility[0] === "y") {
        return;
      }

      const { property, line, compatibilityMessage } = browserInfo;
      const resultKey =
        resultToShow[property] ||
        (resultToShow[property] = {
          property,
          lines: [],
          notices: [],
          suggestion: [],
        });

      let lineInfo = line;

      if (browserInfo.cssMatching) {
        const tailwindClassInfo = browserInfo.cssMatching[property];
        const tailwindClass = tailwindClassInfo.find(
          info => info.path === line,
        );
        lineInfo = `${chalk.whiteBright(tailwindClass.className)} ${line}`;
      }

      const browserQuery = `${selection.browser} ${selection.version}`;
      const autoprefixerPlugin = autoprefixer({
        overrideBrowserslist: [browserQuery],
      });
      const processedCss = postcss(autoprefixerPlugin).process(
        propertyInfo[selection.browser].declaratives.decl,
        {
          from: undefined,
        },
      );

      resultKey.lines.push(lineInfo);
      resultKey.notices.push(compatibilityMessage);

      if (propertyInfo[selection.browser].declaratives.twClass) {
        resultKey.suggestion.push(
          selection.browser,
          `${propertyInfo[selection.browser].declaratives.twClass.slice(1)} -> ${processedCss.css}`,
        );
      } else {
        resultKey.suggestion.push(selection.browser, `${processedCss.css}`);
      }
    });
  });

  Object.values(resultToShow).forEach(dup => {
    dup.lines = [...new Set(dup.lines)];
    dup.notices = [...new Set(dup.notices)];
    dup.suggestion = [...new Set(dup.suggestion)];
    dup.twClass = [...new Set(dup.twClass)];
  });

  return resultToShow;
}

export { renderResult };
