import {
  getAdjacentScrollContainers,
  isWithinHandleHitArea,
  isWithinResizeGripArea,
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

const POINTER_LISTENER_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: false,
};

/**
 * TestQuestionResizableHandleでのタッチ向けポインター処理のカスタムフック
 * @returns Separatorに付与する一意のidサフィックス
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

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        return;
      }

      // event.target は hit area 内でも隣接パネルの要素になり得るため座標で判定する
      if (!isWithinHandleHitArea(handleElement, event.clientX, event.clientY)) {
        return;
      }

      // 中央グリップのみパネルリサイズ
      // バー部分は後続のmoveでスクロール判定する
      if (isWithinResizeGripArea(handleElement, event.clientX, event.clientY)) {
        resetTouchGesture();
        return;
      }

      // react-resizable-panelsのpointerdown(capture)より先に処理し、リサイズ開始を抑止
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
          handleElement.releasePointerCapture(event.pointerId);
          return;
        }
      }

      const step = event.clientY - touchGesture.lastY;
      touchGesture.lastY = event.clientY;

      const containers = getAdjacentScrollContainers(handleElement);
      scrollContainersByDelta(containers, step);

      // スクロールジェスチャー確定後は端まで達していても、リサイズへ流れないよう常に抑止する
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
      POINTER_LISTENER_OPTIONS,
    );
    window.addEventListener(
      "pointermove",
      onPointerMove,
      POINTER_LISTENER_OPTIONS,
    );
    window.addEventListener(
      "pointerup",
      onPointerEnd,
      POINTER_LISTENER_OPTIONS,
    );
    window.addEventListener(
      "pointercancel",
      onPointerEnd,
      POINTER_LISTENER_OPTIONS,
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        onPointerDown,
        POINTER_LISTENER_OPTIONS,
      );
      window.removeEventListener(
        "pointermove",
        onPointerMove,
        POINTER_LISTENER_OPTIONS,
      );
      window.removeEventListener(
        "pointerup",
        onPointerEnd,
        POINTER_LISTENER_OPTIONS,
      );
      window.removeEventListener(
        "pointercancel",
        onPointerEnd,
        POINTER_LISTENER_OPTIONS,
      );
    };
  }, [resizeHandleInstanceId]);

  return resizeHandleInstanceId;
}
