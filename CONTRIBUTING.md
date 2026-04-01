# Contributing To Bonsai Desk

## Local Workflow

1. Run `.\scripts\bootstrap.ps1`
2. Start the app with `.\scripts\run-dev.ps1`
3. Before pushing, run `.\scripts\check.ps1`

## Expectations

- Keep the app usable in local single-user mode on Windows.
- Do not commit local runtime assets, models, logs, or temporary directories.
- Prefer small, reviewable changes with clear runtime and UI behavior.

## Areas That Need Extra Care

- runtime installation and launch flows
- conversation persistence
- streaming behavior and empty/error states
- runtime settings persistence and preset behavior
- compatibility between Bonsai Desk branding and Prism runtime behavior
