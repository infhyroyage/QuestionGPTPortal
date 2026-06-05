/**
 * TestQuestionResizableHandleのIDプレフィックス
 */
export const TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX =
  "test-question-resize-handle";

/** タッチ向け hit area（react-resizable-panels 既定 coarse: 15 より広い） */
const TOUCH_HIT_AREA_MARGINS = { fine: 5, coarse: 40 };

/**
 * 現在のポインター種別に応じた hit area マージン（px）を返す
 * @returns {number} hit area マージン（px）
 */
function getTouchHitAreaMargin(): number {
  if (typeof window === "undefined") {
    return TOUCH_HIT_AREA_MARGINS.fine;
  }

  return window.matchMedia("(pointer: coarse)").matches
    ? TOUCH_HIT_AREA_MARGINS.coarse
    : TOUCH_HIT_AREA_MARGINS.fine;
}

/**
 * タッチ座標がリサイズハンドルの hit area 内かどうかを判定する
 * react-resizable-panels と同様に座標で判定する（event.target はパネル内容になることがある）
 * @param {HTMLElement} handleElement リサイズハンドル要素
 * @param {number} clientX タッチ座標 X
 * @param {number} clientY タッチ座標 Y
 * @returns {boolean} hit area 内の場合は true
 */
export function isWithinHandleHitArea(
  handleElement: HTMLElement,
  clientX: number,
  clientY: number,
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
 * タッチ座標が中央グリップ上かどうかを判定する（グリップ上のみリサイズを許可する）
 * @param {HTMLElement} handleElement リサイズハンドル要素
 * @param {number} clientX タッチ座標 X
 * @param {number} clientY タッチ座標 Y
 * @returns {boolean} グリップ上の場合は true
 */
export function isWithinResizeGripArea(
  handleElement: HTMLElement,
  clientX: number,
  clientY: number,
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
 * リサイズハンドルの直前・直後にあるパネルから、スクロール可能なコンテナを取得する
 * PanelGroup内では、ハンドルのprevious/nextElementSiblingが上下パネルに対応する
 * @param {HTMLElement} handleElement リサイズハンドル要素
 * @returns {HTMLElement[]} スクロール可能なコンテナ要素の配列
 */
export function getAdjacentScrollContainers(
  handleElement: HTMLElement,
): HTMLElement[] {
  const containers: HTMLElement[] = [];

  for (const panel of [
    handleElement.previousElementSibling,
    handleElement.nextElementSibling,
  ]) {
    const container = panel?.querySelector<HTMLElement>(
      "[data-test-question-scroll-container]",
    );
    if (container) {
      containers.push(container);
    }
  }

  return containers;
}

/**
 * 複数のスクロールコンテナに deltaY を順に適用する
 * 上パネル → 下パネルの順で、端までスクロールした分だけ次へ残量を渡す
 * @param {HTMLElement[]} containers スクロール可能なコンテナ要素の配列
 * @param {number} deltaY スクロール量
 * @returns {boolean} いずれかのコンテナでスクロールが発生した場合はtrue、それ以外はfalse
 */
export function scrollContainersByDelta(
  containers: HTMLElement[],
  deltaY: number,
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
      Math.min(maxScroll, previousScrollTop + remaining),
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
