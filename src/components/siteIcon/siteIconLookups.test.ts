import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSiteIconLookups } from "./siteIconLookups";
import type { FoundSiteIcon } from "../../util/siteIconCache";

/** A promise the test settles by hand. */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

const setUp = () => {
  const pending = new Map<
    string,
    ReturnType<typeof deferred<string | undefined>>
  >();
  const found = (url: string) => {
    const next = deferred<string | undefined>();
    pending.set(url, next);
    return next.promise;
  };
  const sent: FoundSiteIcon[][] = [];
  const find = vi.fn(found);
  const findInBrowser = vi.fn(found);
  const lookups = createSiteIconLookups({
    find,
    findInBrowser,
    send: async (batch) => void sent.push(batch),
    sendDelay: 1_000,
  });
  const answer = async (url: string, icon?: string) => {
    pending.get(url)!.resolve(icon);
    await vi.advanceTimersByTimeAsync(0);
  };
  return { lookups, find, findInBrowser, sent, answer };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("looking up Site Icons", () => {
  it("sends every result together once no lookup is still running", async () => {
    const { lookups, sent, answer } = setUp();
    lookups.lookUp("a.test", "https://a.test/", "unknown");
    lookups.lookUp("b.test", "https://b.test/", "unknown");

    await answer("https://a.test/", "icon-a");
    expect(sent).toEqual([]);
    await answer("https://b.test/");

    expect(sent).toEqual([
      [{ host: "a.test", icon: "icon-a" }, { host: "b.test" }],
    ]);
  });

  it("sends what's finished after the delay when a lookup is slow", async () => {
    const { lookups, sent, answer } = setUp();
    lookups.lookUp("a.test", "https://a.test/", "unknown");
    lookups.lookUp("slow.test", "https://slow.test/", "unknown");

    await answer("https://a.test/", "icon-a");
    await vi.advanceTimersByTimeAsync(1_000);

    expect(sent).toEqual([[{ host: "a.test", icon: "icon-a" }]]);
  });

  it("looks each host up once per page", async () => {
    const { lookups, find } = setUp();
    lookups.lookUp("a.test", "https://a.test/one", "unknown");
    lookups.lookUp("a.test", "https://a.test/two", "unknown");

    expect(find).toHaveBeenCalledTimes(1);
  });

  it("asks only the browser to refresh a stale icon", async () => {
    const { lookups, find, findInBrowser, sent, answer } = setUp();
    lookups.lookUp("a.test", "https://a.test/", "stale");
    await answer("https://a.test/");

    expect(find).not.toHaveBeenCalled();
    expect(findInBrowser).toHaveBeenCalledWith("https://a.test/");
    // Sent even when nothing's found, so the stale icon is checked later.
    expect(sent).toEqual([[{ host: "a.test" }]]);
  });
});
