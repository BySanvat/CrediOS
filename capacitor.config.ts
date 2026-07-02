import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bysanvat.credios",
  appName: "CrediOS",
  webDir: "mobile-shell",
  server: {
    url: "https://credios.pages.dev",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#FCFBF7",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: "#FCFBF7",
      style: "LIGHT",
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
