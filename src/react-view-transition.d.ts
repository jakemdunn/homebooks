import "react";

/** Canary-only API; remove when @types/react includes ViewTransition. @see https://react.dev/reference/react/ViewTransition */
declare module "react" {
  /** "auto", "none" or a view-transition-class, optionally by transition type. */
  type ViewTransitionClass = string | Record<string, string>;
  export interface ViewTransitionProps {
    children?: import("react").ReactNode;
    name?: string | Record<string, string>;
    default?: ViewTransitionClass;
    enter?: ViewTransitionClass;
    exit?: ViewTransitionClass;
    update?: ViewTransitionClass;
    share?: ViewTransitionClass;
  }
  export const ViewTransition: import("react").ComponentType<ViewTransitionProps>;
  export function addTransitionType(type: string): void;
}
