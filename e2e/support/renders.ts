import type { BrowserContext, Page } from "@playwright/test";

type Renders = { names: string[] };

/**
 * Records every component React renders, through the hook React DevTools
 * uses. Observes only (ADR-0001): the page runs unchanged. Uses DevTools'
 * "did this fiber render" walk, which only descends where React reworked a
 * subtree. A tile is named from its `id` prop ("tile:bookmark-12"), other
 * components by `displayName` or function name; production builds minify
 * function names, so set a `displayName` on any component a test names.
 */
export const recordRenders = (context: BrowserContext) =>
  context.addInitScript(() => {
    const renders: Renders = { names: [] };
    (window as unknown as { __renders: Renders }).__renders = renders;
    type Fiber = {
      tag: number;
      type?: { displayName?: string; name?: string };
      memoizedProps?: { id?: unknown; node?: { id?: string } };
      memoizedState?: unknown;
      alternate?: Fiber | null;
      child?: Fiber | null;
      sibling?: Fiber | null;
    };
    // React fiber tags: FunctionComponent, ClassComponent, ForwardRef,
    // MemoComponent, SimpleMemoComponent.
    const COMPONENT_TAGS = [0, 1, 11, 14, 15];
    const nameOf = (fiber: Fiber) => {
      const id = fiber.memoizedProps?.id;
      if (typeof id === "string" && /^(bookmark|folder|tab|window)-/.test(id))
        return `tile:${id}`;
      return fiber.type?.displayName ?? fiber.type?.name ?? "component";
    };
    const walk = (first: Fiber | null | undefined) => {
      for (let fiber = first; fiber; fiber = fiber.sibling) {
        const previous = fiber.alternate;
        if (
          COMPONENT_TAGS.includes(fiber.tag) &&
          (!previous ||
            previous.memoizedProps !== fiber.memoizedProps ||
            previous.memoizedState !== fiber.memoizedState)
        )
          renders.names.push(nameOf(fiber));
        if (!previous || previous.child !== fiber.child) walk(fiber.child);
      }
    };
    (
      window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: object }
    ).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers: new Map(),
      inject: () => 1,
      onCommitFiberRoot: (_: unknown, root: { current: Fiber }) => {
        const previous = root.current.alternate;
        if (!previous || previous.child !== root.current.child)
          walk(root.current.child);
      },
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {},
      onScheduleFiberRoot: () => {},
      checkDCE: () => {},
    };
  });

/** The components rendered since the last call, and resets the record. */
export const takeRenders = (page: Page) =>
  page.evaluate(() => {
    const renders = (window as unknown as { __renders: Renders }).__renders;
    return renders.names.splice(0);
  });
