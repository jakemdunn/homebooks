import type { Tabs, Windows } from "webextension-polyfill";
import { copy, createEvent, renumber } from "./events";

/** A Tab to open; its Window's first Tab is active unless one says so. */
export type SeedTab = {
  title: string;
  url: string;
  favIconUrl?: string;
  active?: boolean;
};

/** A Window to open. The first is the current Window. */
export type SeedWindow = { tabs: SeedTab[]; incognito?: boolean };

/** `browser.tabs` and `browser.windows`, in memory. */
export const createFakeTabs = () => {
  let windows: Windows.Window[] = [];
  let tabs: Tabs.Tab[] = [];
  let nextTabId = 1;
  let currentWindowId: number | undefined;
  const events = {
    onAttached:
      createEvent<[id: number, info: Tabs.OnAttachedAttachInfoType]>(),
    onCreated: createEvent<[tab: Tabs.Tab]>(),
    onDetached:
      createEvent<[id: number, info: Tabs.OnDetachedDetachInfoType]>(),
    onMoved: createEvent<[id: number, info: Tabs.OnMovedMoveInfoType]>(),
    onRemoved: createEvent<[id: number, info: Tabs.OnRemovedRemoveInfoType]>(),
    onReplaced: createEvent<[added: number, removed: number]>(),
    onUpdated:
      createEvent<
        [id: number, changes: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab]
      >(),
  };

  const listTabsInWindow = (windowId: number) =>
    tabs
      .filter((tab) => tab.windowId === windowId)
      .sort((a, b) => a.index - b.index);

  const getTab = (id: number) => {
    const tab = tabs.find((tab) => tab.id === id);
    if (!tab) throw new Error(`Invalid tab ID: ${id}`);
    return tab;
  };

  const getWindow = (id: number) => {
    const window = windows.find((window) => window.id === id);
    if (!window) throw new Error(`Invalid window ID: ${id}`);
    return window;
  };

  const openTab = (
    window: Windows.Window,
    { title, url, favIconUrl, active }: SeedTab,
  ) => {
    const tab: Tabs.Tab = {
      id: nextTabId++,
      windowId: window.id,
      index: listTabsInWindow(window.id!).length,
      title,
      url,
      favIconUrl,
      active: !!active,
      highlighted: !!active,
      pinned: false,
      incognito: window.incognito,
      status: "complete",
    };
    tabs.push(tab);
    return tab;
  };

  const openWindow = ({ tabs: seedTabs, incognito = false }: SeedWindow) => {
    const window: Windows.Window = {
      id: windows.length + 1,
      focused: windows.length === 0,
      incognito,
      alwaysOnTop: false,
      type: "normal",
      state: "normal",
    };
    windows.push(window);
    const activeIndex = Math.max(
      seedTabs.findIndex(({ active }) => active),
      0,
    );
    seedTabs.forEach((tab, index) =>
      openTab(window, { ...tab, active: index === activeIndex }),
    );
    return window;
  };

  /** The Tabs matching `query`. A filter the fake doesn't know throws. */
  const queryTabs = ({
    active,
    currentWindow,
    windowId,
    ...unknown
  }: Tabs.QueryQueryInfoType) => {
    if (Object.keys(unknown).length)
      throw new Error(
        `The fake browser can't query Tabs by ${Object.keys(unknown)}.`,
      );
    return tabs.filter(
      (tab) =>
        (active === undefined || tab.active === active) &&
        (currentWindow === undefined ||
          (tab.windowId === currentWindowId) === currentWindow) &&
        (windowId === undefined || tab.windowId === windowId),
    );
  };

  const activateTab = (tab: Tabs.Tab) => {
    listTabsInWindow(tab.windowId!).forEach(
      (other) => (other.active = other === tab),
    );
    events.onUpdated.emit(tab.id!, {}, copy(tab));
  };

  const closeTab = (tab: Tabs.Tab) => {
    tabs = tabs.filter((other) => other !== tab);
    renumber(listTabsInWindow(tab.windowId!));
    events.onRemoved.emit(tab.id!, {
      windowId: tab.windowId!,
      isWindowClosing: false,
    });
  };

  const focusWindow = (window: Windows.Window) => {
    windows.forEach((other) => (other.focused = other === window));
    currentWindowId = window.id;
  };

  /** Replaces every Window and Tab with `seedWindows`. */
  const seed = (seedWindows: SeedWindow[]) => {
    windows = [];
    tabs = [];
    nextTabId = 1;
    seedWindows.forEach(openWindow);
    currentWindowId = windows[0]?.id;
  };

  const tabsApi = {
    ...events,
    query: async (query: Tabs.QueryQueryInfoType) => copy(queryTabs(query)),
    get: async (id: number) => copy(getTab(id)),
    create: async ({
      url = "",
      windowId,
      active = true,
    }: Tabs.CreateCreatePropertiesType) => {
      const tab = openTab(getWindow(windowId ?? currentWindowId!), {
        title: url,
        url,
        active,
      });
      events.onCreated.emit(copy(tab));
      return copy(tab);
    },
    update: async (id: number, { active }: Tabs.UpdateUpdatePropertiesType) => {
      if (active) activateTab(getTab(id));
      return copy(getTab(id));
    },
    remove: async (ids: number | number[]) =>
      [ids].flat().map(getTab).forEach(closeTab),
  };

  const windowsApi = {
    get: async (id: number, { populate }: Windows.GetInfo = {}) => ({
      ...copy(getWindow(id)),
      ...(populate && { tabs: copy(listTabsInWindow(id)) }),
    }),
    create: async ({ url, incognito }: Windows.CreateCreateDataType = {}) => {
      const urls = [url ?? []].flat();
      return copy(
        openWindow({
          incognito,
          tabs: urls.map((url) => ({ title: url, url })),
        }),
      );
    },
    update: async (id: number, { focused }: Windows.UpdateUpdateInfoType) => {
      if (focused) focusWindow(getWindow(id));
      return copy(getWindow(id));
    },
  };

  return { tabs: tabsApi, windows: windowsApi, seed };
};
