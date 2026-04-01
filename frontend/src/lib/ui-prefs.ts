import type { RuntimePanelTab } from "../components/RuntimePanel";

const UI_PREFS_KEY = "bonsai-desk-ui-prefs";
const LEGACY_UI_PREFS_KEY = "prism-launcher-ui-prefs";

export interface UiPrefs {
  showRuntimePanel: boolean;
  runtimeTab: RuntimePanelTab;
}

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = window.localStorage.getItem(UI_PREFS_KEY) ?? window.localStorage.getItem(LEGACY_UI_PREFS_KEY);
    if (!raw) {
      return { showRuntimePanel: false, runtimeTab: "runtime" };
    }

    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      showRuntimePanel: parsed.showRuntimePanel ?? false,
      runtimeTab: parsed.runtimeTab ?? "runtime",
    };
  } catch {
    return { showRuntimePanel: false, runtimeTab: "runtime" };
  }
}

export function saveUiPrefs(prefs: UiPrefs): void {
  window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
}
