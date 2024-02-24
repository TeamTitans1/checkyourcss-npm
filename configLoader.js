import { existsSync, readFileSync } from "fs";

function loadConfig() {
  const configFile = ".cycrc.json";
  if (existsSync(configFile)) {
    const configText = readFileSync(configFile, "utf8");
    const config = JSON.parse(configText);
    return config;
  } else {
    console.error("Configuration file not found.");
    return {};
  }
}

export { loadConfig };
