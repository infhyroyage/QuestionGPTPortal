import ApplyMSAL from "@/components/ApplyMSAL";
import { Button } from "@/components/ui/button";
import TopBar from "./components/TopBar";

/**
 * アプリケーションのエントリーポイント
 * @returns アプリケーションのエントリーポイント
 */
export default function App() {
  return (
    <ApplyMSAL>
      <TopBar />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div>Hello World</div>
        <Button>Click me</Button>
      </div>
    </ApplyMSAL>
  );
}
