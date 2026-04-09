import { Fragment, ReactNode, useCallback } from "react";
import * as i18nMessages from "../../public/_locales/en/messages.json";

type I18nKeys = keyof typeof i18nMessages;
export const i18n = (key: I18nKeys) => browser.i18n.getMessage(key);

function interleaveI18nTemplate(
  message: string,
  substitutions: Record<string, string | ReactNode>,
): string | ReactNode {
  const usesNonString = Object.values(substitutions).some(
    (v) => typeof v !== "string" && typeof v !== "number",
  );
  if (!usesNonString) {
    return message.replace(/{{(.*?)}}/g, (match, name: string) => {
      const v = substitutions[name.trim()];
      return v !== undefined ? String(v) : match;
    });
  }

  const nodes: ReactNode[] = [];
  const re = /{{(.*?)}}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    if (m.index > last) {
      nodes.push(message.slice(last, m.index));
    }
    const name = m[1]?.trim() ?? "";
    nodes.push(name in substitutions ? substitutions[name]! : m[0]);
    last = m.index + m[0].length;
  }
  if (last < message.length) {
    nodes.push(message.slice(last));
  }
  return <Fragment>{nodes}</Fragment>;
}

export type UseI18n = ((key: I18nKeys) => string) &
  ((
    key: I18nKeys,
    substitutions: Record<string, string | ReactNode>,
  ) => string | ReactNode);

export const useI18n = (): UseI18n =>
  useCallback(
    (key: I18nKeys, substitutions?: Record<string, string | ReactNode>) => {
      const message = i18n(key);
      if (substitutions === undefined) return message;
      return interleaveI18nTemplate(message, substitutions);
    },
    [],
  ) as UseI18n;
