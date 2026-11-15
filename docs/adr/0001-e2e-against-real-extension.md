# E2E tests run the built extension in real Chromium, with no browser-API mocks

Drag and drop in Homebooks is native HTML5 DnD whose drops call `browser.bookmarks` and `browser.tabs`. Earlier refactors were "verified" against a page served by `vite dev` with a stubbed `browser` global and hand-built drag events, so the tests passed whenever the stub agreed with itself while real behaviour broke. We decided that e2e tests load the production build as an unpacked extension in Chromium through Playwright, seed and read state through the real extension APIs, and drive every drag with real pointer input (`page.mouse`, `locator.dragTo`). They never dispatch synthetic `DragEvent`s or replace `browser.*`.

## Considered Options

- **Mocked page under `vite dev`**: fast, but it tests the mock rather than the app. Rejected.
- **Firefox, the primary target**: spiked in Firefox 158 with Selenium (classic Marionette actions) and Puppeteer (WebDriver BiDi), headless and headed. The add-on loads, seeding works, and a real `dragstart` fires with the app's payload, but releasing the pointer never produces `drop` or `dragend`. Firefox automation can't complete a native drag, so it can't verify drag and drop. Rejected until that changes.

## Consequences

- Chromium had to work first, so a shim makes Chromium's `browser.bookmarks` behave like Firefox's, which the app is written against. It's installed at each entry point (homepage, popup and background each have their own `browser` object) and skipped on Firefox (detected by `runtime.getBrowserInfo`). It does three things:
  - Fills `type` from `url` on every read, because Chromium's `BookmarkTreeNode` has no `type` and the app branches on it everywhere.
  - Translates `move` indexes. Firefox's index is the node's final position and appends when out of range; Chromium's is the slot before the node is removed and throws when out of range. Measured in Firefox 158 and Chromium 159, and pinned in `src/util/bookmarkIndex.test.ts`.
  - Clamps `create` indexes, because Chromium throws on an out-of-range index where Firefox appends.

  The shim is test infrastructure that ships: Chromium isn't a supported target yet (#36), and it's the reason drop indexes match Firefox in the e2e suite. The `chrome_settings_overrides` homepage key is Firefox-only, because Chromium rejects a relative homepage URL and refuses to load the extension.
- Firefox drag and drop is verified by hand after each drag refactor. Firefox-only paths such as `text/x-moz-url` external drops are covered by unit tests of their parsing.
- Pure logic (Drop Position calculation, drag state reducer, `DataTransfer` parsing) is unit-tested with Vitest, without mocking `browser`.
