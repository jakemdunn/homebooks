/**
 * Measures height only, at most once a frame: Chrome's split view resizes
 * the page dozens of times a second, and its users only read height.
 */
export const HEIGHT_ONLY_ONCE_PER_FRAME = {
  handleWidth: false,
  refreshMode: "throttle",
  refreshRate: 16,
} as const;
