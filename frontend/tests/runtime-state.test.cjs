const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadTsModule(relativePath, globals = {}) {
  const sourcePath = path.resolve(__dirname, "..", relativePath);
  const source = fs.readFileSync(sourcePath, "utf-8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    ...globals,
  };

  vm.runInNewContext(transpiled, sandbox, { filename: sourcePath });
  return Object.keys(sandbox.module.exports).length > 0 ? sandbox.module.exports : sandbox.exports;
}

const runtimeConfig = loadTsModule("src/lib/runtime-config.ts");

const normalized = runtimeConfig.normalizeRuntimeConfig({
  host: "127.0.0.1",
  port: 8080,
  model_filename: "",
  model_variant: "",
  runtime_binary_path: " ",
  model_file_path: "",
  system_prompt: "",
  temperature: Number.NaN,
  top_k: 0,
  top_p: 2,
  min_p: -1,
  max_tokens: -10,
  ctx_size: -1,
  gpu_layers: -2,
  threads: 0,
  reasoning_budget: 42,
  reasoning_format: "",
  enable_thinking: 1,
});

assert.equal(normalized.model_filename, "Bonsai-8B.gguf");
assert.equal(normalized.model_variant, "8B");
assert.equal(normalized.runtime_binary_path, null);
assert.equal(normalized.model_file_path, null);
assert.equal(normalized.system_prompt, "You are a helpful assistant.");
assert.equal(normalized.temperature, 0.6);
assert.equal(normalized.top_k, 1);
assert.equal(normalized.top_p, 1);
assert.equal(normalized.min_p, 0);
assert.equal(normalized.max_tokens, 1);
assert.equal(normalized.ctx_size, 0);
assert.equal(normalized.gpu_layers, 0);
assert.equal(normalized.threads, 1);
assert.equal(normalized.reasoning_budget, -1);
assert.equal(normalized.reasoning_format, "none");
assert.equal(normalized.enable_thinking, true);

const powerPreset = runtimeConfig.applyRuntimePreset("power", {
  ...normalized,
  model_filename: "Bonsai-4B.gguf",
  model_variant: "4B",
});

assert.equal(powerPreset.model_filename, "Bonsai-4B.gguf");
assert.equal(powerPreset.model_variant, "4B");
assert.equal(runtimeConfig.detectRuntimePreset(powerPreset), "power");

const storage = new Map([
  ["prism-launcher-ui-prefs", JSON.stringify({ showRuntimePanel: true, runtimeTab: "logs" })],
]);
const uiPrefs = loadTsModule("src/lib/ui-prefs.ts", {
  window: {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  },
});

assert.equal(
  JSON.stringify(uiPrefs.loadUiPrefs()),
  JSON.stringify({ showRuntimePanel: true, runtimeTab: "logs" }),
);

uiPrefs.saveUiPrefs({ showRuntimePanel: false, runtimeTab: "parameters" });
assert.equal(
  storage.get("bonsai-desk-ui-prefs"),
  JSON.stringify({ showRuntimePanel: false, runtimeTab: "parameters" }),
);

console.log("Frontend runtime-state tests passed.");
