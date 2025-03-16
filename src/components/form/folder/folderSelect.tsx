import { Field, FieldAttributes, FieldInputProps, FieldProps } from "formik";
import { FC, useCallback, useEffect, useState } from "react";
import { bookmarks } from "webextension-polyfill";
import {
  optionExpandStyle,
  optionGroupStyle,
  optionsStyle,
  optionStyle,
} from "./folderSelect.css";
import { useConditionalClassNames } from "../../../util/useConditionalClassNames";

type FolderOption = { title: string; value: string; children?: FolderOption[] };

interface FolderSelectProps {
  field: FieldInputProps<unknown>;
  toggleExpanded: (id: string) => void;
  expanded: string[];
  depth: number;
}
const FolderSelectOption: FC<FolderOption & FolderSelectProps> = ({
  value,
  title,
  field,
  children,
  expanded,
  toggleExpanded,
  depth,
}) => {
  const expandClassNames = useConditionalClassNames(
    {
      expanded: () => expanded.includes(value),
    },
    optionExpandStyle
  );
  const optionClassNames = useConditionalClassNames(
    {
      selected: () => value === field.value,
    },
    optionGroupStyle
  );
  return (
    <div key={value}>
      <div
        className={optionClassNames}
        style={{ paddingLeft: `${depth * 0.5 + 1}rem` }}
      >
        {!!children?.length && (
          <span
            onClick={() => toggleExpanded(value)}
            className={expandClassNames}
          />
        )}
        <button
          type="button"
          className={optionStyle}
          onClick={() => {
            field.onChange(field.name)(value);
          }}
          onBlur={field.onBlur(field.name)}
        >
          {title}
        </button>
      </div>
      {!!children?.length && expanded.includes(value) && (
        <FolderSelectOptions
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          field={field}
          depth={depth + 1}
        >
          {children}
        </FolderSelectOptions>
      )}
    </div>
  );
};
const FolderSelectOptions: FC<
  { children: FolderOption[] } & FolderSelectProps
> = ({ children, ...props }) => {
  return children.map((child) => <FolderSelectOption {...child} {...props} />);
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
              value: node.id,
            });
          }
          if (node.children && node.title) {
            return [
              ...result,
              {
                title: node.title,
                value: node.id,
                children: getOptions(node.children),
              },
            ];
          }
          if (node.children) {
            return [...result, ...getOptions(node.children)];
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
    <div className={optionsStyle}>
      <Field {...props}>
        {({ field }: FieldProps<unknown>) => {
          return (
            <FolderSelectOptions
              expanded={expanded}
              field={field}
              toggleExpanded={toggleExpanded}
              depth={0}
            >
              {options}
            </FolderSelectOptions>
          );
        }}
      </Field>
    </div>
  );
};
