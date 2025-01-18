import { Loader2 } from "lucide-react";

/**
 * ブラウザの画面中央でローディングアイコンを表示するコンポーネント
 * @returns ブラウザの画面中央でローディングアイコンを表示するコンポーネント
 */
export default function LoadingCenter() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={150} className="animate-spin" />
    </div>
  );
}
