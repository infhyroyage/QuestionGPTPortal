/* eslint-disable react-refresh/only-export-components */
import clsx from "clsx";
import * as ResizablePrimitive from "react-resizable-panels";

export const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={clsx(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

export const ResizablePanel = ResizablePrimitive.Panel;
