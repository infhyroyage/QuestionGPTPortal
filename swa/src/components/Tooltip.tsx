import { cn } from "@/lib/utils";
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
 */
export default function Tooltip({
  tip,
  children,
  className,
  position = "bottom",
}: TooltipProps) {
  return (
    <div
      className={cn("tooltip", positionClasses[position], className)}
      data-tip={tip}
    >
      {children}
    </div>
  );
}
