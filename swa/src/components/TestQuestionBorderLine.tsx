import { TestQuestionBorderLineProps } from "@/types/props";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * TestQuestionPageの境界線を表示するコンポーネント
 * @returns TestQuestionPageの境界線を表示するコンポーネント
 */
export default function TestQuestionBorderLine({
  setSubjectHeightPercent,
}: TestQuestionBorderLineProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragSessionRef = useRef<{
    pointerId: number;
    el: HTMLDivElement;
    onMove: (ev: PointerEvent) => void;
    onEnd: (ev: PointerEvent) => void;
  } | null>(null);

  // 境界線のドラッグセッションをクリーンアップする処理
  const cleanupSeparatorDrag = useCallback((pointerId?: number): void => {
    const session = dragSessionRef.current;
    if (!session) return;
    if (pointerId !== undefined && session.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", session.onMove);
    window.removeEventListener("pointerup", session.onEnd);
    window.removeEventListener("pointercancel", session.onEnd);
    if (session.el.hasPointerCapture(session.pointerId)) {
      session.el.releasePointerCapture(session.pointerId);
    }
    dragSessionRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupSeparatorDrag();
    };
  }, [cleanupSeparatorDrag]);

  // 境界線のドラッグ時のハンドラで呼び出すためのリサイズ処理
  const applyResizeFromClient = useCallback(
    (clientY: number): void => {
      // SubjectDisplayの領域の縦幅を10%~90%の範囲でリサイズ
      const header = document.querySelector("header");
      const headerHeight = header ? header.offsetHeight : 0;
      const availableHeight = window.innerHeight - headerHeight;
      const newHeight = ((clientY - headerHeight) / availableHeight) * 100;
      if (newHeight >= 10 && newHeight <= 90) {
        setSubjectHeightPercent(newHeight);
      }
    },
    [setSubjectHeightPercent],
  );

  // 境界線のドラッグ時のハンドラ
  const handlePointerDownBorderLine = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): void => {
      // 既にドラッグセッションが存在する場合は何もしない
      if (dragSessionRef.current !== null) return;
      // マウスの左クリック以外は何もしない
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // デフォルトの動作を防止
      e.preventDefault();

      // ドラッグセッションを作成
      const el = e.currentTarget;
      const pointerId = e.pointerId;
      el.setPointerCapture(pointerId);

      // リサイズ処理を適用
      applyResizeFromClient(e.clientY);

      // ドラッグ中のハンドラを作成
      const onMove = (ev: PointerEvent): void => {
        if (ev.pointerId !== pointerId) return;
        applyResizeFromClient(ev.clientY);
      };
      const onEnd = (ev: PointerEvent): void => {
        if (ev.pointerId !== pointerId) return;
        cleanupSeparatorDrag(pointerId);
      };
      dragSessionRef.current = { pointerId, el, onMove, onEnd };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);

      setIsDragging(true);
    },
    [applyResizeFromClient, cleanupSeparatorDrag],
  );

  // 境界線のダブルクリック時のリセット処理
  const handleDoubleClickBorderLine = useCallback((): void => {
    setSubjectHeightPercent(60);
  }, [setSubjectHeightPercent]);

  return (
    <div
      className={`h-1 shrink-0 cursor-row-resize touch-none select-none transition-colors ${
        isDragging ? "bg-primary" : "bg-base-content/20 hover:bg-primary"
      }`}
      onPointerDown={handlePointerDownBorderLine}
      onLostPointerCapture={(ev: ReactPointerEvent<HTMLDivElement>) => {
        cleanupSeparatorDrag(ev.pointerId);
      }}
      onDoubleClick={handleDoubleClickBorderLine}
      role="separator"
    />
  );
}
