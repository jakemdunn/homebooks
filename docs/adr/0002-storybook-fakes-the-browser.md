# Storybook renders against a fake browser, and its screenshots come from a browser in Docker

ADR-0001 rejected a stubbed `browser` for e2e tests, because those tests passed whenever the stub agreed with itself. The Storybook styleguide (#55) needs components to render outside the extension, where no `browser.*` exists. We decided that, in Storybook only, `webextension-polyfill` resolves to an in-memory fake browser (`.storybook/fakeBrowser/`). It behaves like Firefox, and each story seeds it. Storybook shows how components look; it never verifies what they do. Behaviour is still verified by the e2e suite against the real extension, as ADR-0001 requires.

The screenshot tests (`pnpm test:visual`) run their browser in Playwright's Linux Docker image, at the `@playwright/test` version, and connect to it from the test runner on the host. Only the browser renders pixels, so only the browser needs a fixed environment for references to match across machines.

## Considered Options

- **Refactor components to take their data as props**: no fake, but the app's code would change to suit Storybook, and stories would no longer show the components as the Homepage wires them. Rejected.
- **A fake per story, through a Storybook mocking addon**: each story would rebuild the parts of the browser it needs, so the copies would drift apart. Rejected for one shared fake.
- **Run the test runner and Storybook's server in the container too**: the container would need its own Linux install of every dependency, since the host's `node_modules` holds native binaries for the host's platform. That's slower and more to maintain, and gives the same pixels. Rejected.

## Consequences

- The fake can drift from the real browser. It covers only the calls rendered components make, has its own unit tests (`.storybook/fakeBrowser/fakeBrowser.test.ts`), and throws on a Tab query it doesn't support. A component that calls something new fails visibly in Storybook.
- Drag and drop, and anything else that changes Bookmarks or Tabs, is out of Storybook's scope. The fake's writes exist so that clicking around in Storybook doesn't throw, not to test them.
- The fake is never used by the app, the unit tests of the app, or the e2e suite.
- `pnpm test:visual` needs Docker running. A future CI job (#31) needs Docker too.
