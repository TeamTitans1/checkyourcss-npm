import inquirer from "inquirer";
import axios from "axios";

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

async function selectBrowsersAndVersions() {
  const canIUseData = await getCanIUseData();
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

  const browserChoices = [
    { name: "Chrome", value: "Chrome" },
    { name: "FireFox", value: "FireFox" },
    { name: "Safari", value: "Safari" },
    { name: "Edge", value: "Edge" },
    { name: "Opera", value: "Opera" },
    { name: "Samsung_Mobile", value: "Samsung_Mobile" },
    { name: "Chrome_for_android", value: "Chrome_for_android" },
    { name: "Android", value: "Android" },
    { name: "Safari_on_iOS", value: "Safari_on_iOS" },
    { name: "FireFox_for_android", value: "FireFox_for_android" },
  ];

  const { selectedBrowsers } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedBrowsers",
      message: "Select browsers:",
      choices: browserChoices,
    },
  ]);

  let browserVersions = [];
  for (const browserKey of selectedBrowsers) {
    const versions = browsers[browserKey].version.map(v => ({
      name: v.version,
      value: v.version,
    }));
    const { selectedVersion } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedVersion",
        message: `Select a version for ${browserKey}: `,
        choices: versions,
      },
    ]);

    browserVersions.push({
      browser: browserKey,
      version: selectedVersion,
    });
  }

  return browserVersions;
}

export { selectBrowsersAndVersions };
