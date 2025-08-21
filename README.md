# Safe Signal - Emergency Alert and Disaster Resource App

## Installing

   ```bash
   npx create-expo-app@latest

   What is your app named? » application

   cd .\application\

   npx expo start
   ```
generate the qr code + scan aand build

## remove sample project

npm run reset-project

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```


In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo


## What is .expo file

> Why do I have a folder named ".expo" in my project?
The ".expo" folder is created when an Expo project is started using "expo start" command.
> What do the files contain?
- "devices.json": contains information about devices that have recently opened this project. This is used to populate the "Development sessions" list in your development builds.
- "settings.json": contains the server configuration that is used to serve the application manifest.
> Should I commit the ".expo" folder?
No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.



## File	Description
application/tsconfig.json	TypeScript configuration extending Expo's base config with strict mode and path mapping
application/package.json	Project dependencies and scripts for Expo React Native app
application/eslint.config.js	ESLint configuration using Expo's flat config format
application/app/index.tsx	Basic home screen component with centered text
application/app/_layout.tsx	Root layout component using Expo Router's Stack navigation
application/app.json	Expo app configuration with platform-specific settings
application/.vscode/settings.json	VS Code editor settings for code formatting
application/.gitignore	Git ignore patterns for Expo and React Native projects
README.md	Updated documentation with setup and installation instructions


## Install Nativewind
npm install nativewind react-native-reanimated@~3.17.4 react-native-safe-area-context@5.4.0

npm install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11


## Setup Tailwind CSS
npx tailwindcss init

### tailwind.config.js 
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}


## Create a CSS file and add the Tailwind directives.

### global.css
@tailwind base;
@tailwind components;
@tailwind utilities;


## Add the Babel preset

### babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};


##  Create or modify your metro.config.js

npx expo customize metro.config.js

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
module.exports = withNativeWind(config, { input: './global.css' })


## Import your CSS file in App.js

