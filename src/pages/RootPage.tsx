import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";

/**
 * ルートページのコンポーネント
 * @returns ルートページのコンポーネント
 */
export default function RootPage() {
  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div>Hello World</div>
        <Button>Click me</Button>
      </div>
    </>
  );
}
