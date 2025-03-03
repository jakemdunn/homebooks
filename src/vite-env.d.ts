/// <reference types="vite/client" />

interface Clipboard extends EventTarget {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Clipboard/read) */
  read(formats?: { unsanitized: string[] }): Promise<ClipboardItems>;
}
