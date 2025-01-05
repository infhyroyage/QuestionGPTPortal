import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router";

/**
 * ルートページのコンポーネント
 * @returns ルートページのコンポーネント
 */
export default function RootPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div>Hello World</div>
        <Button
          onClick={() => {
            navigate("/tests/123/ready");
          }}
        >
          Click me
        </Button>
      </div>
    </>
  );
}
