import chalk from "chalk";

function renderResult(userSelections, result) {
  const resultToShow = {};
  userSelections.forEach(selection => {
    result.forEach(propertyInfo => {
      if (propertyInfo[selection.browser]) {
        propertyInfo[selection.browser].compatibilityMessage =
          `${propertyInfo[selection.browser].property} is supported ${selection.browser} from version ${propertyInfo[selection.browser].versionsSupport[0]} and higher.`;
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
        });

      let lineInfo = line;

      if (browserInfo.cssMatching) {
        const tailwindClassInfo = browserInfo.cssMatching[property];
        const tailwindClass = tailwindClassInfo.find(
          info => info.path === line,
        );
        lineInfo = `${chalk.green(tailwindClass.className)} ${line}`;
      }

      resultKey.lines.push(lineInfo);
      resultKey.notices.push(compatibilityMessage);
    });
  });

  Object.values(resultToShow).forEach(dup => {
    dup.lines = [...new Set(dup.lines)];
    dup.notices = [...new Set(dup.notices)];
  });

  return resultToShow;
}

export { renderResult };
