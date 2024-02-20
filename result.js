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
      if (
        propertyInfo[selection.browser] &&
        propertyInfo[selection.browser].compatibility[0] !== "y"
      ) {
        if (resultToShow[propertyInfo[selection.browser].property]) {
          resultToShow[propertyInfo[selection.browser].property].lines.push(
            propertyInfo[selection.browser].line,
          );
          resultToShow[propertyInfo[selection.browser].property].notices.push(
            propertyInfo[selection.browser].compatibilityMessage,
          );
        } else {
          resultToShow[propertyInfo[selection.browser].property] = {
            property: propertyInfo[selection.browser].property,
            lines: [propertyInfo[selection.browser].line],
            notices: [propertyInfo[selection.browser].compatibilityMessage],
          };
        }
      }
    });
  });

  Object.values(resultToShow).forEach(dup => {
    dup.lines = [...new Set(dup.lines)];
    dup.notices = [...new Set(dup.notices)];
  });

  return resultToShow;
}

export { renderResult };
