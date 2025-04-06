import { useMemo } from "react";

export const useConditionalClassNames = (
  conditions: Record<string, boolean | (() => boolean)>,
  ...baseClassNames: (string | undefined)[]
) =>
  useMemo<string>(
    () =>
      Object.entries(conditions)
        .reduce<string[]>(
          (classNames, [className, condition]) =>
            condition === true ||
            (typeof condition === "function" && condition())
              ? [...classNames, className]
              : classNames,
          baseClassNames.filter((className) => className !== undefined)
        )
        .join(" "),
    [baseClassNames, conditions]
  );
