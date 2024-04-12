# checkyourcss-npm

[![npm version](https://img.shields.io/npm/v/checkyourcss)](https://www.npmjs.com/package/checkyourcss)
[![Downloads](https://img.shields.io/npm/dt/checkyourcss)](https://www.npmjs.com/package/checkyourcss)

## Description

CheckYourCSS(CYC) is a tool for checking compatibility of CSS on your project.

- CYC can check CSS compatibility on the project that is made with TailwindCSS and styled-components.
- CYC builds your project on the temporary directory using `os.tmpdir()` method when getting the CSS properties from the project that is created with TailwindCSS.
- CYC uses an AST to get all the CSS properties from the project.
- CYC uses an [autoprefixer](https://www.npmjs.com/package/autoprefixer) to add the prefix to the incompatible CSS properties.

## Table of Content

1. [Installation and Usage Guide](#installation-and-usage-guide)
2. [Configuration](#configuration)

## Installation and Usage Guide

You can install CheckYourCSS using this command:

```shell
npm install checkyourcss
```

After installation, you can check the compatibility of whole CSS properties on your project using this command:

```shell
npx cyc
```

If the project is made with styled-components, cyc converts your incompatible CSS code into code with browser prefixes added using this command:

- The whole CSS code will change:
  ```shell
  cyc --fix .
  ```
- The specific CSS file will change:
  ```shell
  cyc --fix specific/path
  ```

## Configuration

You can make configuration file(.cycrc.json) using this command:

```shell
npx cyc --init
```

The configuration file looks like this:

```json
{
  "browsers": [{ "browser": "Chrome", "version": 121 }],
  "lineInfo": true,
  "compatibilityInfo": true
}
```

You can add more information about the browser. The `version` in `browsers` means cyc checks for your project CSS compatibility for taht version and above.

When `lineInfo` is true, it shows where the CSS with poor compatibility is located on the result. (The default value is true.)

`compatibilityInfo` provides the information about which version the CSS is compatible.
