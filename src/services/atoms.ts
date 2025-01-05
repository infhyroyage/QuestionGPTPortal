import { atom } from "jotai";

/**
 * ダークモードの場合はtrue、ライトモードの場合はfalse
 * toggleDarkModeAtomで隠蔽するためexportしない
 */
const isDarkModeAtom = atom(true);

/**
 * ダークモード化のフラグと、ダークモード切替え用のatom
 */
export const toggleDarkModeAtom = atom(
  (get) => get(isDarkModeAtom),
  (get, set) => {
    const isDarkMode = get(isDarkModeAtom);
    set(isDarkModeAtom, !isDarkMode);
  }
);
