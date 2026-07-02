import { describe, expect, it } from "vitest";
import { isFirebaseBrowserConfigured, type FirebaseBrowserConfig } from "../env";

const completeConfig: FirebaseBrowserConfig = {
  enabled: true,
  apiKey: "api-key",
  authDomain: "credios.firebaseapp.com",
  projectId: "credios",
  storageBucket: "credios.firebasestorage.app",
  messagingSenderId: "123",
  appId: "1:123:web:abc",
};

describe("firebase env guard", () => {
  it("requires the migration flag to be enabled", () => {
    expect(isFirebaseBrowserConfigured({ ...completeConfig, enabled: false })).toBe(false);
  });

  it("requires all public browser config values", () => {
    expect(isFirebaseBrowserConfigured({ ...completeConfig, appId: "" })).toBe(false);
    expect(isFirebaseBrowserConfigured({ ...completeConfig, projectId: "" })).toBe(false);
  });

  it("accepts a complete enabled browser config", () => {
    expect(isFirebaseBrowserConfigured(completeConfig)).toBe(true);
  });
});
