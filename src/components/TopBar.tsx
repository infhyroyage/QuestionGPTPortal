import { TopBarProps } from "@/types/props";
import DarkModeSwitch from "./DarkModeSwitch";

/**
 * トップバーのコンポーネント
 * @returns トップバーのコンポーネント
 */
export default function TopBar({ title }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 p-3 bg-slate-100 dark:bg-slate-900">
      <div className="mx-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">{title}</h1>
        <DarkModeSwitch />
      </div>
    </div>
  );
}
