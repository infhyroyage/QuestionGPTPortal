/**
 * TestQuestionPage のリサイズハンドル向けスクロール補助ユーティリティ。
 *
 * react-resizable-panels の PanelResizeHandle はホイール／タッチを奪いやすく、
 * ハンドル上から上下パネル（問題文・選択肢）をスクロールできなくなる。
 * 本モジュールは、ハンドル操作を隣接パネル内のスクロールコンテナへ転送するための
 * セレクタ・定数・関数を提供する。
 */

/** TestQuestionPage 内でスクロール対象となる要素を示す data 属性 */
export const TEST_QUESTION_SCROLL_CONTAINER_SELECTOR =
  "[data-test-question-scroll-container]";

/** TestQuestionResizableHandle の DOM id プレフィックス（useId と組み合わせて使用） */
export const TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX =
  "test-question-resize-handle";

/** タッチ操作時にスクロールと判定する移動量の閾値（px） */
export const TOUCH_SCROLL_THRESHOLD_PX = 10;

/** タッチ操作時に縦スクロールとみなす縦横比（大きいほどスクロール判定が緩い） */
export const TOUCH_SCROLL_DOMINANCE_RATIO = 1.2;

/** タッチ向け hit area（react-resizable-panels 既定 coarse: 15 より広い） */
export const TOUCH_HIT_AREA_MARGINS = { fine: 5, coarse: 40 };

/** 現在のポインター種別に応じた hit area マージン（px）を返す */
export function getTouchHitAreaMargin(): number {
  if (typeof window === "undefined") {
    return TOUCH_HIT_AREA_MARGINS.fine;
  }

  return window.matchMedia("(pointer: coarse)").matches
    ? TOUCH_HIT_AREA_MARGINS.coarse
    : TOUCH_HIT_AREA_MARGINS.fine;
}

/**
 * タッチ座標がリサイズハンドルの hit area 内かどうか。
 * react-resizable-panels と同様に座標で判定する（event.target はパネル内容になることがある）。
 */
export function isWithinHandleHitArea(
  handleElement: HTMLElement,
  clientX: number,
  clientY: number
): boolean {
  const { left, right, top, bottom } = handleElement.getBoundingClientRect();
  const margin = getTouchHitAreaMargin();

  return (
    clientX >= left - margin &&
    clientX <= right + margin &&
    clientY >= top - margin &&
    clientY <= bottom + margin
  );
}

/**
 * タッチ座標が中央グリップ上かどうか（グリップ上のみリサイズを許可する）。
 */
export function isWithinResizeGripArea(
  handleElement: HTMLElement,
  clientX: number,
  clientY: number
): boolean {
  const grip = handleElement.querySelector("[data-resize-grip]");
  if (!grip) {
    return false;
  }

  const { left, right, top, bottom } = grip.getBoundingClientRect();

  return (
    clientX >= left &&
    clientX <= right &&
    clientY >= top &&
    clientY <= bottom
  );
}

/**
 * リサイズハンドルの直前・直後にあるパネルから、スクロール可能なコンテナを取得する。
 * PanelGroup 内ではハンドルの previous/nextElementSibling が上下パネルに対応する。
 */
export function getAdjacentScrollContainers(
  handleElement: HTMLElement
): HTMLElement[] {
  const containers: HTMLElement[] = [];

  for (const panel of [
    handleElement.previousElementSibling,
    handleElement.nextElementSibling,
  ]) {
    const container = panel?.querySelector<HTMLElement>(
      TEST_QUESTION_SCROLL_CONTAINER_SELECTOR
    );
    if (container) {
      containers.push(container);
    }
  }

  return containers;
}

/**
 * 複数のスクロールコンテナに deltaY を順に適用する。
 * 上パネル → 下パネルの順で、端までスクロールした分だけ次へ残量を渡す。
 *
 * @returns いずれかのコンテナでスクロールが発生した場合 true
 */
export function scrollContainersByDelta(
  containers: HTMLElement[],
  deltaY: number
): boolean {
  let remaining = deltaY;

  for (const container of containers) {
    if (remaining === 0) {
      break;
    }

    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) {
      continue;
    }

    const previousScrollTop = container.scrollTop;
    const nextScrollTop = Math.max(
      0,
      Math.min(maxScroll, previousScrollTop + remaining)
    );
    const applied = nextScrollTop - previousScrollTop;

    if (applied === 0) {
      continue;
    }

    container.scrollTop = nextScrollTop;
    remaining -= applied;
  }

  return remaining !== deltaY;
}
