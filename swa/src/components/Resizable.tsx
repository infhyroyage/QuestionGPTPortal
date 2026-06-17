/* eslint-disable react-refresh/only-export-components */
import clsx from "clsx";
import * as ResizablePrimitive from "react-resizable-panels";

export const ResizablePanelGroup = ({
  className,
  ...props
}: ResizablePrimitive.GroupProps) => (
  <ResizablePrimitive.Group
    className={clsx(
      "flex h-full w-full aria-[orientation=vertical]:flex-col",
      className,
    )}
    {...props}
  />
);

export const ResizablePanel = ResizablePrimitive.Panel;
