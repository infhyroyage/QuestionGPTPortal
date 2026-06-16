import clsx from "clsx";
import { type ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "error";

export type ButtonSize = "default" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  success: "btn-success",
  error: "btn-error",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "",
  lg: "btn-lg",
  icon: "btn-square",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * daisyUI の btn をベースにしたボタンコンポーネント
 * @returns ボタンコンポーネント
 */
export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx("btn", variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
