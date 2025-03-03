import { FC, useCallback, useEffect, useMemo, useState } from "react";
import browser from "webextension-polyfill";
import { Flipper } from "react-flip-toolkit";
import { tabsActionsStyle, tabsWrapperStyle } from "./tabs.css";
import { WindowComponent } from "./window";
import { extensionURL } from "../drag/dragContext.util";
import { PiAppWindowFill } from "react-icons/pi";

export const TabsProvider: FC = () => {
  const [tabs, setTabs] = useState<
    {
      windowId: string;
      tabs: browser.Tabs.Tab[];
    }[]
  >();
  const [closedTabs, setClosedTabs] = useState<Set<string>>(new Set());
  const flipKey = useMemo(
    () =>
      [
        (tabs?.map((window) => window.windowId) ?? []).join(","),
        [...closedTabs].join(","),
      ].join("-"),
    [closedTabs, tabs],
  );

  useEffect(() => {
    type TabEvents = keyof Pick<
      typeof browser.tabs,
      | "onAttached"
      | "onCreated"
      | "onDetached"
      | "onMoved"
      | "onRemoved"
      | "onReplaced"
      | "onUpdated"
    >;
    const tabEvents: TabEvents[] = [
      "onAttached",
      "onCreated",
      "onDetached",
      "onMoved",
      "onRemoved",
      "onReplaced",
      "onUpdated",
    ];
    const updateTabs =
      (type?: TabEvents) =>
      async (...props: unknown[]) => {
        let tabs = await browser.tabs.query({});

        if (type === "onRemoved") {
          tabs = tabs.filter((tab) => tab.id !== props[0]);
        }

        const tabsByWindow = tabs
          .filter((tab) => !tab.url?.includes(extensionURL))
          .reduce<Record<number, browser.Tabs.Tab[]>>((byWindow, tab) => {
            const windowId = tab.windowId ?? 0;
            return {
              ...byWindow,
              [windowId]: [...(byWindow[windowId] ?? []), tab],
            };
          }, {});
        setTabs(
          Object.entries(tabsByWindow).map(([windowId, tabs]) => ({
            windowId,
            tabs,
          })),
        );
      };
    updateTabs()();

    const listeners = tabEvents.reduce<Record<TabEvents, () => void>>(
      (accumulator, event) => {
        const listener = updateTabs(event);
        browser.tabs[event].addListener(listener);
        return {
          ...accumulator,
          [event]: listener,
        };
      },
      {} as Record<TabEvents, () => void>,
    );

    return () => {
      tabEvents.map((event) =>
        browser.tabs[event].removeListener(listeners[event]),
      );
    };
  }, []);

  const onFolderClick = useCallback(
    (windowId: string) => () => {
      setClosedTabs((prev) => {
        const updated = new Set([...prev]);
        if (prev.has(windowId)) {
          updated.delete(windowId);
        } else {
          updated.add(windowId);
        }
        return updated;
      });
    },
    [],
  );

  return (
    <div className={tabsWrapperStyle}>
      <header className={tabsActionsStyle}>
        {tabs?.length} Window{(tabs?.length ?? 0) > 1 ? "s " : " "}
        <PiAppWindowFill />
      </header>
      <Flipper flipKey={flipKey} spring="noWobble">
        <div data-grid-container>
          {tabs?.map((window, index) => (
            <WindowComponent
              {...window}
              isOpen={!closedTabs.has(window.windowId)}
              onClick={onFolderClick(window.windowId)}
              index={index}
              id={`window-${window.windowId}`}
              key={window.windowId}
            />
          ))}
        </div>
      </Flipper>
    </div>
  );
};
