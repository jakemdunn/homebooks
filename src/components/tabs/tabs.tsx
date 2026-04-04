import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import browser from "webextension-polyfill";
import {
  tabsActionsStyle,
  tabsContentStyle,
  tabsHeight,
  tabsWrapperStyle,
} from "./tabs.css";
import { WindowComponent } from "./window";
import { extensionURL } from "../drag/dragProvider.util";
import { PiAppWindowFill } from "react-icons/pi";
import { useResizeDetector } from "react-resize-detector";
import { assignInlineVars } from "@vanilla-extract/dynamic";

export const TabsProvider: FC = () => {
  const [tabs, setTabs] = useState<
    {
      windowId: string;
      tabs: browser.Tabs.Tab[];
    }[]
  >();

  const [closedTabs, setClosedTabs] = useState<Set<string>>(new Set());

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

        const currentWindowId = (
          await browser.tabs.query({
            active: true,
            currentWindow: true,
          })
        )[0].windowId;

        const tabsByWindow = tabs
          .filter(
            (tab) =>
              !tab.url?.includes(extensionURL) && !tab.url?.match(/^about:/),
          )
          .reduce<Record<number, browser.Tabs.Tab[]>>((byWindow, tab) => {
            const windowId = tab.windowId ?? 0;
            return {
              ...byWindow,
              [windowId]: [...(byWindow[windowId] ?? []), tab],
            };
          }, {});
        setTabs(
          Object.entries(tabsByWindow)
            .map(([windowId, tabs]) => ({
              windowId,
              tabs,
            }))
            .sort((a, b) => {
              if (!currentWindowId) return 0;
              if (Number(a.windowId) === currentWindowId) return -1;
              if (Number(b.windowId) === currentWindowId) return 1;
              return 0;
            }),
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
      startTransition(() =>
        setClosedTabs((prev) => {
          const updated = new Set([...prev]);
          if (prev.has(windowId)) {
            updated.delete(windowId);
          } else {
            updated.add(windowId);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const { height, ref } = useResizeDetector();
  const topOffset = useMemo(() => (height ?? 0) + 100, [height]);

  return (
    <div className={tabsWrapperStyle}>
      <header className={tabsActionsStyle}>
        {tabs?.length} Window{(tabs?.length ?? 0) !== 1 ? "s " : " "}
        <PiAppWindowFill />
      </header>
      <div
        className={tabsContentStyle}
        style={assignInlineVars({ [tabsHeight]: `${topOffset}px` })}
        ref={ref}
      >
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
      </div>
    </div>
  );
};
