export const TEST_QUESTION_SCROLL_CONTAINER_SELECTOR =
  "[data-test-question-scroll-container]";

export const TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX =
  "test-question-resize-handle";

/** タッチ操作時にスクロールと判定する移動量の閾値（px） */
export const TOUCH_SCROLL_THRESHOLD_PX = 10;

/** タッチ操作時に縦スクロールとみなす縦横比（大きいほどスクロール判定が緩い） */
export const TOUCH_SCROLL_DOMINANCE_RATIO = 1.2;

/** タッチ向け hit area（既定 coarse: 15 より広い） */
export const TOUCH_HIT_AREA_MARGINS = { fine: 5, coarse: 40 };

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
