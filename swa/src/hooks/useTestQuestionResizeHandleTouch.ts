import {
  getAdjacentScrollContainers,
  scrollContainersByDelta,
  TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX,
  TOUCH_SCROLL_DOMINANCE_RATIO,
  TOUCH_SCROLL_THRESHOLD_PX,
} from "@/lib/scroll";
import { useEffect, useId } from "react";

/**
 * TestQuestionResizableHandle 向けのタッチ操作フック。
 *
 * タッチ端末では PanelResizeHandle が pointer イベントを先に捕捉し、
 * 縦スワイプがリサイズと誤判定されやすい。本フックは次を行う:
 *
 * - グリップ（data-resize-grip）上のタッチ → リサイズライブラリに任せる
 * - ハンドルバー上のタッチ → 縦方向の移動を緩くスクロールとみなし、上下パネルをスクロール
 *
 * capture フェーズで pointer イベントを監視し、スクロール時は
 * stopImmediatePropagation でリサイズ開始を抑止する。
 *
 * @returns PanelResizeHandle に付与する一意の id サフィックス（useId）
 */
type TouchGestureState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastY: number;
  isScrollGesture: boolean;
};

export function useTestQuestionResizeHandleTouch() {
  const resizeHandleInstanceId = useId();

  useEffect(() => {
    const handleElement = document.getElementById(
      `${TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX}-${resizeHandleInstanceId}`
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

      // 中央グリップのみパネルリサイズ。バー部分は後続 move でスクロール判定する
      if (isResizeGripTarget(event.target)) {
        resetTouchGesture();
        return;
      }

      // react-resizable-panels の pointerdown（capture）より先に処理し、リサイズ開始を抑止
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
        // 微小な揺れは無視
        if (
          Math.abs(deltaY) < TOUCH_SCROLL_THRESHOLD_PX &&
          Math.abs(deltaX) < TOUCH_SCROLL_THRESHOLD_PX
        ) {
          return;
        }

        // 縦成分が横より十分大きい場合のみスクロール gesture とみなす（緩い判定）
        if (Math.abs(deltaY) > Math.abs(deltaX) * TOUCH_SCROLL_DOMINANCE_RATIO) {
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
