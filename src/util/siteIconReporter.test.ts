import { afterEach, describe, expect, it, vi } from "vitest";
import { createSiteIconReporter } from "./siteIconReporter";
import type { SiteIconMessage } from "./siteIconMessages";

const A = { host: "a.test", icon: "data:icon-a" };
const NO_RECEIVER = new Error(
  "Could not establish connection. Receiving end does not exist.",
);

type Record = (message: SiteIconMessage) => Promise<unknown>;

const setUp = (send = vi.fn<Record>(async () => undefined)) => {
  const recordHere = vi.fn<Record>(async () => undefined);
  return {
    send,
    recordHere,
    reporter: createSiteIconReporter({ send, recordHere }),
  };
};

const failingSend = () =>
  vi.fn<Record>(async () => {
    throw NO_RECEIVER;
  });

afterEach(() => vi.restoreAllMocks());

describe("reporting Site Icons", () => {
  it("sends them to the background", async () => {
    const { send, recordHere, reporter } = setUp();

    await reporter.report("siteIcons.tabsSeen", [A]);

    expect(send).toHaveBeenCalledWith({
      type: "siteIcons.tabsSeen",
      found: [A],
    });
    expect(recordHere).not.toHaveBeenCalled();
  });

  it("records them on the page when the background doesn't answer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { recordHere, reporter } = setUp(failingSend());

    await reporter.report("siteIcons.lookedUp", [A]);

    expect(recordHere).toHaveBeenCalledWith({
      type: "siteIcons.lookedUp",
      found: [A],
    });
  });

  it("logs why the background didn't answer", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { reporter } = setUp(failingSend());

    await reporter.report("siteIcons.lookedUp", [A]);

    expect(logged).toHaveBeenCalledWith(expect.any(String), NO_RECEIVER);
  });

  it("sends the same icon again when asked again", async () => {
    const { send, reporter } = setUp();

    await reporter.report("siteIcons.tabsSeen", [A]);
    await reporter.report("siteIcons.tabsSeen", [A]);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("sends nothing when there's nothing to report", async () => {
    const { send, reporter } = setUp();

    await reporter.report("siteIcons.tabsSeen", []);

    expect(send).not.toHaveBeenCalled();
  });
});
