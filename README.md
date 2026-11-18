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

## Styleguide

[Storybook](https://storybook.js.org) shows the UI's components in their states, outside the extension:

```sh
pnpm storybook           # http://localhost:6006
pnpm build:storybook     # a static copy in dist-storybook/
```

Inside Storybook, `webextension-polyfill` is an in-memory fake browser (`.storybook/fakeBrowser/`), seeded with sample Bookmarks, Tabs and storage. A story changes that data with its `browser` parameter. Nothing in a story touches the network: Site Icons and fonts are built in.

### Visual tests

`pnpm test:visual` builds Storybook, screenshots every story and compares each with its reference in `visual/__screenshots__/`. The browser runs in Playwright's Linux Docker image, at the same version as `@playwright/test`, so references match on every machine. Docker must be running. The first run pulls the image (a few minutes).

After an intended visual change, update the references and commit them:

```sh
pnpm test:visual:update
```
