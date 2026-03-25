import "react";

/** Canary-only API; remove when @types/react includes ViewTransition. @see https://react.dev/reference/react/ViewTransition */
declare module "react" {
  export interface ViewTransitionProps {
    children?: import("react").ReactNode;
    name?: string | Record<string, string>;
    default?: "auto" | "none" | string;
    enter?: "auto" | "none" | string;
    exit?: "auto" | "none" | string;
    update?: "auto" | "none" | string;
    share?: "auto" | "none" | string;
  }
  export const ViewTransition: import("react").ComponentType<ViewTransitionProps>;
}
