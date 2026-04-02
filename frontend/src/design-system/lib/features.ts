interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage?: number;
  requires?: string[];
}

interface FeatureFlags {
  newDesignSystem: FeatureFlag;
  newTypography: FeatureFlag;
  newMessageLayout: FeatureFlag;
  newRuntimePanel: FeatureFlag;
  newSidebar: FeatureFlag;
  accessibilityImprovements: FeatureFlag;
}

const envFlags = {
  newDesignSystem: import.meta.env.VITE_NEW_DESIGN === "true",
  newTypography: import.meta.env.VITE_NEW_TYPOGRAPHY === "true",
  newMessageLayout: import.meta.env.VITE_NEW_MESSAGE_LAYOUT === "true",
  newRuntimePanel: import.meta.env.VITE_NEW_RUNTIME_PANEL === "true",
  newSidebar: import.meta.env.VITE_NEW_SIDEBAR === "true",
  accessibilityImprovements: import.meta.env.VITE_ACCESSIBILITY_IMPROVEMENTS === "true",
};

export const features: FeatureFlags = {
  newDesignSystem: {
    enabled: envFlags.newDesignSystem,
    rolloutPercentage: 0,
  },
  newTypography: {
    enabled: envFlags.newDesignSystem || envFlags.newTypography,
    requires: ["newDesignSystem"],
  },
  newMessageLayout: {
    enabled: envFlags.newDesignSystem || envFlags.newMessageLayout,
    requires: ["newDesignSystem"],
  },
  newRuntimePanel: {
    enabled: envFlags.newDesignSystem || envFlags.newRuntimePanel,
    requires: ["newDesignSystem"],
  },
  newSidebar: {
    enabled: envFlags.newDesignSystem || envFlags.newSidebar,
    requires: ["newDesignSystem"],
  },
  accessibilityImprovements: {
    enabled: true,
  },
};

export function useFeatureFlag<K extends keyof FeatureFlags>(
  flagName: K
): boolean {
  const flag = features[flagName];
  
  if (!flag.enabled) {
    return false;
  }

  if (flag.requires) {
    return flag.requires.every((req) => features[req as keyof FeatureFlags].enabled);
  }

  return flag.enabled;
}

export function getAllFeatureFlags(): FeatureFlags {
  return { ...features };
}

export function isNewDesignEnabled(): boolean {
  return useFeatureFlag("newDesignSystem");
}
