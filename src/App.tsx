import ApplyMSAL from "@/components/ApplyMSAL";
import { Button } from "@/components/ui/button";

/**
 * アプリケーションのエントリーポイント
 * @returns アプリケーションのエントリーポイント
 */
export default function App() {
  return (
    <ApplyMSAL>
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div>Hello World</div>
        <Button>Click me</Button>
      </div>
    </ApplyMSAL>
  );
}
