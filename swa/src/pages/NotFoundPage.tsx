import TopBar from "@/components/TopBar";
import { Frown } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";

/**
 * 404ページのコンポーネント
 * @returns 404ページのコンポーネント
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="pt-[52px] flex items-center justify-center min-h-screen flex-col space-y-4">
        <Frown size={100} />
        <div>Not Found</div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onClick}
        >
          トップページへ戻る
        </button>
      </div>
    </>
  );
}
