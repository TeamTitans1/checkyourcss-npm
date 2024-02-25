import path from "path";
import fs from "fs";
import { selectBrowsersAndVersions } from "./userSelection.js";

const currentPath = process.cwd();

async function createConfig() {
  const userSelections = await selectBrowsersAndVersions();
  const configPath = path.join(currentPath, ".cycrc.json");
  const defaultConfig = {
    browsers: userSelections,
    lineInfo: true,
    compatibilityInfo: true,
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

export { createConfig };
