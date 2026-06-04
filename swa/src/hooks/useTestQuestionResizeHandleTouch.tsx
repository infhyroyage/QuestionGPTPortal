import {
  getAdjacentScrollContainers,
  scrollContainersByDelta,
  TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX,
} from "@/lib/scroll";
import { useEffect, useId } from "react";

type TouchGestureState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastY: number;
  isScrollGesture: boolean;
};

/**
 * TestQuestionResizableHandleでのタッチ向けポインター処理のカスタムフック
 * @returns PanelResizeHandleに付与する一意のidサフィックス
 */
export function useTestQuestionResizeHandleTouch() {
  const resizeHandleInstanceId = useId();

  useEffect(() => {
    const handleElement = document.getElementById(
      `${TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX}-${resizeHandleInstanceId}`,
    );
    if (!handleElement) {
      return;
    }

    let touchGesture: TouchGestureState | null = null;

    const resetTouchGesture = () => {
      touchGesture = null;
    };

    const isResizeGripTarget = (target: EventTarget | null) => {
      if (!(target instanceof Node)) {
        return false;
      }
      const grip = handleElement.querySelector("[data-resize-grip]");
      return grip?.contains(target) ?? false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        return;
      }

      if (
        !(event.target instanceof Node) ||
        !handleElement.contains(event.target)
      ) {
        return;
      }

      // 中央グリップのみパネルリサイズ
      // バー部分は後続のmoveでスクロール判定する
      if (isResizeGripTarget(event.target)) {
        resetTouchGesture();
        return;
      }

      // react-resizable-panelsのpointerdown(capture)より先に処理し、リサイズ開始を抑止
      event.stopImmediatePropagation();

      touchGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastY: event.clientY,
        isScrollGesture: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!touchGesture || touchGesture.pointerId !== event.pointerId) {
        return;
      }

      const deltaY = event.clientY - touchGesture.startY;
      const deltaX = event.clientX - touchGesture.startX;

      if (!touchGesture.isScrollGesture) {
        // 微小な揺れ(10px未満)は無視
        if (Math.abs(deltaY) < 10 && Math.abs(deltaX) < 10) {
          return;
        }

        // 縦成分が横成分の1.2倍以上大きい場合のみスクロールジェスチャーとみなすことで、
        // タッチ操作とスクロール操作の判定を緩くする
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          touchGesture.isScrollGesture = true;
        } else {
          resetTouchGesture();
          return;
        }
      }

      const step = event.clientY - touchGesture.lastY;
      touchGesture.lastY = event.clientY;

      const containers = getAdjacentScrollContainers(handleElement);
      if (scrollContainersByDelta(containers, step)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (touchGesture?.pointerId === event.pointerId) {
        resetTouchGesture();
      }
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove, { capture: true });
    window.addEventListener("pointerup", onPointerEnd, { capture: true });
    window.addEventListener("pointercancel", onPointerEnd, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      window.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      window.removeEventListener("pointerup", onPointerEnd, { capture: true });
      window.removeEventListener("pointercancel", onPointerEnd, {
        capture: true,
      });
    };
  }, [resizeHandleInstanceId]);

  return resizeHandleInstanceId;
}
