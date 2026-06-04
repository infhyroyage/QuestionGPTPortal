/**
 * TestQuestionResizableHandleのIDプレフィックス
 */
export const TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX =
  "test-question-resize-handle";

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
