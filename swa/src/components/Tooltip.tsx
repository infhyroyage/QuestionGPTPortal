import clsx from "clsx";
import { type ReactNode } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

const positionClasses: Record<TooltipPosition, string> = {
  top: "tooltip-top",
  bottom: "tooltip-bottom",
  left: "tooltip-left",
  right: "tooltip-right",
};

type TooltipProps = {
  tip: string;
  children: ReactNode;
  className?: string;
  position?: TooltipPosition;
};

/**
 * daisyUI の tooltip ラッパー
 * 親要素の overflow で隠れないよう z-index を付与する
 */
export default function Tooltip({
  tip,
  children,
  className,
  position = "bottom",
}: TooltipProps) {
  return (
    <div
      className={clsx(
        "tooltip z-50 before:z-50 after:z-50",
        positionClasses[position],
        className
      )}
      data-tip={tip}
    >
      {children}
    </div>
  );
}
