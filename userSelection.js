import inquirer from "inquirer";

async function selectBrowsersAndVersions() {
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
  for (const browser of selectedBrowsers) {
    const { version } = await inquirer.prompt([
      {
        type: "input",
        name: "version",
        message: `Enter versions for ${browser}: `,
      },
    ]);

    browserVersions.push({
      browser,
      version: version.split(",").map(v => v.trim()),
    });
  }

  return browserVersions;
}

export { selectBrowsersAndVersions };
