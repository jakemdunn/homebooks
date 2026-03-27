import { Field, FieldAttributes, FieldInputProps, FieldProps } from "formik";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Bookmarks, bookmarks } from "webextension-polyfill";
import {
  optionExpandStyle,
  optionGroupStyle,
  optionsStyle,
  optionStyle,
} from "./folderSelect.css";
import { useConditionalClassNames } from "../../../util/useConditionalClassNames";
import {
  useDataTransferFromNode,
  useSetDataTransfer,
} from "../../drag/dragProvider.util";
import { HeightToggle } from "../../heightToggle/heightToggle";

type FolderOption = {
  children?: FolderOption[];
  node: Bookmarks.BookmarkTreeNode;
  nodeIds: Set<string>;
  title: string;
};

interface FolderSelectProps {
  depth: number;
  expanded: string[];
  field: FieldInputProps<unknown>;
  toggleExpanded: (id: string) => void;
}

/** IDs of folders that must be expanded for `targetId` to be visible (not including `targetId`). */
function ancestorFolderIdsToShowSelection(
  options: FolderOption[],
  targetId: string,
  prefix: string[] = []
): string[] | null {
  for (const opt of options) {
    if (opt.node.id === targetId) return prefix;
    if (opt.children?.length) {
      const found = ancestorFolderIdsToShowSelection(opt.children, targetId, [
        ...prefix,
        opt.node.id,
      ]);
      if (found !== null) return found;
    }
  }
  return null;
}
const FolderSelectOption: FC<FolderOption & FolderSelectProps> = ({
  children,
  depth,
  expanded,
  field,
  node,
  nodeIds,
  title,
  toggleExpanded,
}) => {
  const [source, dragId] = useDataTransferFromNode(node);
  const onDragStart = useSetDataTransfer(source, dragId);
  const isExpanded = useMemo(
    () => expanded.includes(node.id),
    [expanded, node.id]
  );
  const expandClassNames = useConditionalClassNames(
    {
      expanded: () => isExpanded,
    },
    optionExpandStyle
  );
  const optionClassNames = useConditionalClassNames(
    {
      selected: () => node.id === field.value,
      selectedInside: () =>
        node.id !== field.value &&
        typeof field.value === "string" &&
        nodeIds.has(field.value),
    },
    optionGroupStyle
  );
  return (
    <div
      data-container
      data-drag-id={`folder-${node.id}`}
      draggable
      key={node.id}
      onDragStart={onDragStart}
    >
      <div className={optionClassNames}>
        {!!children?.length && (
          <button
            type="button"
            onClick={(event) => {
              toggleExpanded(node.id);
              event.stopPropagation();
            }}
            className={expandClassNames}
            style={{ left: `${depth * 0.5}rem` }}
          />
        )}
        <button
          type="button"
          className={optionStyle}
          onBlur={field.onBlur(field.name)}
          onClick={() => {
            field.onChange(field.name)(node.id);
          }}
          style={{ paddingLeft: `${depth * 0.5 + 1}rem` }}
        >
          {title}
        </button>
      </div>
      {!!children?.length && (
        <HeightToggle hidden={!isExpanded}>
          <FolderSelectOptions
            depth={depth + 1}
            expanded={expanded}
            field={field}
            toggleExpanded={toggleExpanded}
          >
            {children}
          </FolderSelectOptions>
        </HeightToggle>
      )}
    </div>
  );
};
const FolderSelectOptions: FC<
  { children: FolderOption[] } & FolderSelectProps
> = ({ children, ...props }) => {
  return children.map((child) => (
    <FolderSelectOption key={child.node.id} {...child} {...props} />
  ));
};

const AutoExpandToSelection: FC<{
  options: FolderOption[];
  selectedId: unknown;
  setExpanded: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ options, selectedId, setExpanded }) => {
  useEffect(() => {
    if (typeof selectedId !== "string" || !selectedId || options.length === 0) {
      return;
    }
    const path = ancestorFolderIdsToShowSelection(options, selectedId);
    if (path === null || path.length === 0) return;

    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of path) next.add(id);
      const arr = [...next];
      return arr.length === prev.length && path.every((id) => prev.includes(id))
        ? prev
        : arr;
    });
  }, [options, selectedId, setExpanded]);

  return null;
};

export const FolderSelect: FC<FieldAttributes<unknown>> = (props) => {
  const [options, setOptions] = useState<FolderOption[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => {
      if (current.includes(id)) {
        return current.filter((option) => option !== id);
      } else {
        return [...current, id];
      }
    });
  }, []);

  useEffect(() => {
    const getBookmarks = async () => {
      const tree = await bookmarks.getTree();
      const getOptions = (nodes: typeof tree): FolderOption[] => {
        return nodes.reduce<FolderOption[]>((result, node) => {
          if (node.type === "folder" && node.title && !node.children) {
            result.push({
              title: node.title,
              node,
              nodeIds: new Set([node.id]),
            });
          }
          if (node.children) {
            const children = getOptions(node.children);
            const nodeIds = new Set([
              node.id,
              ...children.map((child) => [...child.nodeIds.values()]).flat(),
            ]);
            return [
              ...result,
              {
                title: node.title ? node.title : "Browser Root",
                node,
                children,
                nodeIds,
              },
            ];
          }
          return result;
        }, []);
      };
      setOptions(getOptions(tree));
    };
    getBookmarks();
    bookmarks.onChanged.addListener(getBookmarks);
    bookmarks.onCreated.addListener(getBookmarks);
    bookmarks.onMoved.addListener(getBookmarks);
    bookmarks.onRemoved.addListener(getBookmarks);

    return () => {
      bookmarks.onChanged.removeListener(getBookmarks);
      bookmarks.onCreated.removeListener(getBookmarks);
      bookmarks.onMoved.removeListener(getBookmarks);
      bookmarks.onRemoved.removeListener(getBookmarks);
    };
  }, []);

  return (
    <div className={optionsStyle} data-grid-container>
      <Field {...props}>
        {({ field }: FieldProps<unknown>) => (
          <>
            <AutoExpandToSelection
              options={options}
              selectedId={field.value}
              setExpanded={setExpanded}
            />
            <FolderSelectOptions
              expanded={expanded}
              field={field}
              toggleExpanded={toggleExpanded}
              depth={0}
            >
              {options}
            </FolderSelectOptions>
          </>
        )}
      </Field>
    </div>
  );
};
