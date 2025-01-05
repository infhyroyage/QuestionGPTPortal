import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { basePath } from "@/services/github";
import { Frown } from "lucide-react";
import { useNavigate } from "react-router";

/**
 * 404ページのコンポーネント
 * @returns 404ページのコンポーネント
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <Frown size={100} />
        <div>Not Found</div>
        <Button
          onClick={() => {
            navigate(`${basePath}/`);
          }}
        >
          トップページへ戻る
        </Button>
      </div>
    </>
  );
}
