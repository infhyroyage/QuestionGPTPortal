import {
  getAdjacentScrollContainers,
  isWithinHandleHitArea,
  isWithinResizeGripArea,
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
 * - ハンドル hit area 上のタッチ → 縦方向の移動を緩くスクロールとみなし、上下パネルをスクロール
 *
 * capture フェーズで pointer イベントを監視し、スクロール時は
 * stopImmediatePropagation でリサイズ開始を抑止する。
 * hit area 判定は座標ベース（react-resizable-panels と同様）とする。
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

const POINTER_LISTENER_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: false,
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

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        return;
      }

      // event.target は hit area 内でも隣接パネルの要素になり得るため座標で判定する
      if (
        !isWithinHandleHitArea(handleElement, event.clientX, event.clientY)
      ) {
        return;
      }

      // 中央グリップのみパネルリサイズ。バー部分は後続 move でスクロール判定する
      if (isWithinResizeGripArea(handleElement, event.clientX, event.clientY)) {
        resetTouchGesture();
        return;
      }

      // react-resizable-panels の pointerdown（body capture）より先に処理し、リサイズ開始を抑止
      event.preventDefault();
      event.stopImmediatePropagation();

      handleElement.setPointerCapture(event.pointerId);

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
          handleElement.releasePointerCapture(event.pointerId);
          return;
        }
      }

      const step = event.clientY - touchGesture.lastY;
      touchGesture.lastY = event.clientY;

      const containers = getAdjacentScrollContainers(handleElement);
      scrollContainersByDelta(containers, step);

      // スクロール gesture 確定後は端まで達していても、リサイズへ流れないよう常に抑止する
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (touchGesture?.pointerId !== event.pointerId) {
        return;
      }

      if (handleElement.hasPointerCapture(event.pointerId)) {
        handleElement.releasePointerCapture(event.pointerId);
      }

      resetTouchGesture();
    };

    window.addEventListener(
      "pointerdown",
      onPointerDown,
      POINTER_LISTENER_OPTIONS
    );
    window.addEventListener(
      "pointermove",
      onPointerMove,
      POINTER_LISTENER_OPTIONS
    );
    window.addEventListener("pointerup", onPointerEnd, POINTER_LISTENER_OPTIONS);
    window.addEventListener(
      "pointercancel",
      onPointerEnd,
      POINTER_LISTENER_OPTIONS
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        onPointerDown,
        POINTER_LISTENER_OPTIONS
      );
      window.removeEventListener(
        "pointermove",
        onPointerMove,
        POINTER_LISTENER_OPTIONS
      );
      window.removeEventListener(
        "pointerup",
        onPointerEnd,
        POINTER_LISTENER_OPTIONS
      );
      window.removeEventListener(
        "pointercancel",
        onPointerEnd,
        POINTER_LISTENER_OPTIONS
      );
    };
  }, [resizeHandleInstanceId]);

  return resizeHandleInstanceId;
}
