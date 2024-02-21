import axios from "axios";
import bcd from "@mdn/browser-compat-data" assert { type: "json" };

async function getCanIUseData() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json",
    );

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

function getVersionCompatibility(selection, property, canIUseData, line) {
  const agentsData = canIUseData.agents;
  const browsers = {
    Chrome: {
      version: agentsData.chrome.version_list,
      stat: "chrome",
    },
    FireFox: {
      version: agentsData.firefox.version_list,
      stat: "firefox",
    },
    Safari: {
      version: agentsData.safari.version_list,
      stat: "safari",
    },
    Edge: {
      version: agentsData.edge.version_list,
      stat: "edge",
    },
    Opera: {
      version: agentsData.opera.version_list,
      stat: "opera",
    },
    Samsung_Mobile: {
      version: agentsData.samsung.version_list,
      stat: "samsung",
    },
    Chrome_for_android: {
      version: agentsData.and_chr.version_list,
      stat: "and_chr",
    },

    Android: {
      version: agentsData.android.version_list,
      stat: "android",
    },

    Safari_on_iOS: {
      version: agentsData.ios_saf.version_list,
      stat: "ios_saf",
    },

    FireFox_for_android: {
      version: agentsData.and_ff.version_list,
      stat: "and_ff",
    },
  };
  const browserName = convertBrowserName(browsers[selection.browser].stat);
  const versionsNotSupport = [];
  const versionsSupport = [];
  let isCompatible = false;

  if (property in canIUseData) {
    const version = selection.version;
    const stat = browsers[selection.browser].stat;
    const browserCompatibilityByVersions =
      canIUseData[property].stats[browsers[selection.browser].stat];

    for (const version in browserCompatibilityByVersions) {
      const compatibility = browserCompatibilityByVersions[version];

      if (compatibility[0] !== "y") {
        versionsNotSupport.push(version);
      } else {
        versionsSupport.push(version);
      }
    }

    versionsNotSupport.sort((a, b) => a - b);
    versionsSupport.sort((a, b) => a - b);

    return {
      [selection.browser]: {
        property,
        compatibility: canIUseData[property].stats[stat][version],
        line,
        versionsNotSupport,
        versionsPartiallySupport,
        versionsSupport,
      },
    };
  } else if (property in bcd.css.properties) {
    const stat = bcd.css.properties[property].__compat.support[browserName];
    let versionRangeToVersion = selection.version;

    if (
      typeof selection.version === "string" &&
      selection.version.includes("-")
    ) {
      versionRangeToVersion = convertToNumberWithOneDecimal(selection.version);
    }

    let propertyAddedVersion;

    function sanitizeAndCheckCompatibility(stat, versionRangeToVersion) {
      propertyAddedVersion = Array.isArray(stat)
        ? stat[0].version_added
        : stat.version_added;

      propertyAddedVersion = propertyAddedVersion.replace(/^\D*/, "");

      if (isNaN(propertyAddedVersion)) {
        propertyAddedVersion = propertyAddedVersion.replace(/^\D+/, "");
      }

      const sanitizedVersion = parseInt(propertyAddedVersion, 10);

      return (
        !isNaN(sanitizedVersion) && sanitizedVersion <= versionRangeToVersion
      );
    }

    // 사용 예시:
    const isCompatible = sanitizeAndCheckCompatibility(
      stat,
      versionRangeToVersion,
    );

    browsers[selection.browser].version.forEach(versionInfo => {
      if (Number(versionInfo.version) < Number(propertyAddedVersion)) {
        versionsNotSupport.push(versionInfo.version);
      } else if (Number(versionInfo.version) >= Number(propertyAddedVersion)) {
        versionsSupport.push(versionInfo.version);
      }

      versionsNotSupport.sort((a, b) => a - b);
      versionsSupport.sort((a, b) => a - b);
    });

    return {
      [selection.browser]: {
        property,
        compatibility: isCompatible ? "y" : "n",
        line,
        versionsNotSupport,
        versionsSupport,
      },
    };
  }
}

function convertToNumberWithOneDecimal(numberRangeStr) {
  const parts = numberRangeStr.split("-");
  const numbers = parts.map(part => {
    const match = part.match(/^\d+\.\d?/);

    return match ? parseFloat(match[0]) : NaN;
  });
  const average = (numbers[0] + numbers[1]) / 2;

  return Math.round(average * 10) / 10;
}

function convertBrowserName(browserStat) {
  switch (browserStat) {
    case "samsung":
      return "samsunginternet_android";
    case "and_chr":
      return "chrome_android";
    case "android":
      return "webview_android";
    case "ios_saf":
      return "safari_ios";
    case "and_ff":
      return "firefox_android";
    default:
      return browserStat;
  }
}

async function checkCssCompatibility(cssInfo, userSelections) {
  const result = [];
  const canIUseData = await getCanIUseData();

  cssInfo.forEach(info => {
    info.cssProperties.forEach(property => {
      userSelections.forEach(selection => {
        const compatibilityInfo = getVersionCompatibility(
          selection,
          property.property,
          canIUseData,
          property.line,
        );

        if (compatibilityInfo) {
          if (info.cssMatching) {
            compatibilityInfo[selection.browser].cssMatching = info.cssMatching;
          }
          result.push(compatibilityInfo);
        }
      });
    });
  });

  return result;
}

export { checkCssCompatibility };
