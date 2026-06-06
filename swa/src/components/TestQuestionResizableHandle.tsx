import { GripVertical } from "lucide-react";
import { useCallback } from "react";

import { useTestQuestionResizeHandleTouch } from "@/hooks/useTestQuestionResizeHandleTouch";
import {
  getAdjacentScrollContainers,
  scrollContainersByDelta,
  TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX,
} from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { PanelResizeHandle } from "react-resizable-panels";

const TestQuestionResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean;
}) => {
  const resizeHandleInstanceId = useTestQuestionResizeHandleTouch();

  const handleWheel = useCallback<
    NonNullable<React.ComponentProps<typeof PanelResizeHandle>["onWheel"]>
  >(
    (event) => {
      const handleElement = document.getElementById(
        `${TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX}-${resizeHandleInstanceId}`,
      );
      if (!handleElement) {
        return;
      }

      const containers = getAdjacentScrollContainers(handleElement);
      if (containers.length === 0) {
        return;
      }

      if (scrollContainersByDelta(containers, event.deltaY)) {
        event.preventDefault();
      }
    },
    [resizeHandleInstanceId],
  );

  return (
    <PanelResizeHandle
      id={`${TEST_QUESTION_RESIZE_HANDLE_ID_PREFIX}-${resizeHandleInstanceId}`}
      className={cn(
        "relative flex w-px items-center justify-center bg-base-300 hover:bg-sky-500 transition-colors duration-200 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      hitAreaMargins={{ fine: 5, coarse: 40 }}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
      {...props}
    >
      {withHandle && (
        <div
          data-resize-grip
          className="z-20 flex h-4 w-3 items-center justify-center rounded-sm border border-base-300 bg-base-300 hover:bg-sky-500 transition-colors duration-200"
        >
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </PanelResizeHandle>
  );
};

export default TestQuestionResizableHandle;
