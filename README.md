# homebooks

## Development

Install with [pnpm](https://pnpm.io) 11 or newer. `pnpm-workspace.yaml` sets how old a package version must be before this repo installs it, and which dependencies may run install scripts.

```sh
pnpm install
pnpm dev          # Firefox and Chrome side by side
pnpm dev:firefox  # Firefox only
pnpm dev:chrome   # Chrome only
```

Each browser builds into its own folder (`dist/firefox`, `dist/chrome`) and reloads Homebooks when you edit a source file. Each keeps a persistent profile in `.profiles/` (gitignored), so bookmarks you set up survive a restart. Delete a folder there to start that browser fresh.

Chrome runs Playwright's Chrome for Testing, since branded Google Chrome can't load an unpacked extension from the command line. Install it with `npx playwright install chromium` if it's missing, or set `CHROMIUM_BINARY` to another Chromium:

```sh
CHROMIUM_BINARY=/path/to/chromium pnpm dev:chrome
```
