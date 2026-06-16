import { atom } from "jotai";
import type { ReactNode } from "react";

/**
 * トーストの種類(daisyUI の alert クラスに対応)
 */
export type ToastVariant = "info" | "error";

/**
 * 表示する1件のトースト
 */
export type Toast = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: ToastVariant;
};

/**
 * 同時に表示するトーストの最大数
 */
export const TOAST_LIMIT = 1;

/**
 * 表示中のトースト一覧を管理する atom
 */
export const toastsAtom = atom<Toast[]>([]);
