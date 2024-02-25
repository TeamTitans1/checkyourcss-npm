import { existsSync, writeFileSync } from "fs";
import { join } from "path";

const configPath = join(process.cwd(), ".cycrc.json");
const defaultConfig = `{
  "browsers": [
    { "browser": "Chrome", "version": 121 }
  ],
  "lineInfo": true,
  "compatibilityInfo": true
}
`;

if (!existsSync(configPath)) {
  writeFileSync(configPath, defaultConfig);
  console.log("config.js has been created.");
} else {
  console.log("config.js already exists.");
}
