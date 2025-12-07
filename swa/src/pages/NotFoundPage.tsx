import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
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
        <Button onClick={onClick} size="lg">
          トップページへ戻る
        </Button>
      </div>
    </>
  );
}
