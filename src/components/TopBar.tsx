import { basePath } from "@/lib/github";
import { TopBarProps } from "@/types/props";
import { useLocation } from "react-router";
import DarkModeSwitchButton from "./DarkModeSwitchButton";
import ReturnRootPageButton from "./ReturnRootPageButton";

/**
 * トップバーのコンポーネント
 * @returns トップバーのコンポーネント
 */
export default function TopBar({ title }: TopBarProps) {
  const location = useLocation();

  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] p-3 bg-slate-200 dark:bg-slate-800 z-10">
      <div className="mx-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">{title}</h1>
        <div className="flex items-center space-x-2">
          {location.pathname !== `${basePath}/` && <ReturnRootPageButton />}
          <DarkModeSwitchButton />
        </div>
      </div>
    </div>
  );
}
