import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/ui/use-toast";

/**
 * 翻訳失敗用のトーストのカスタムフック
 * @returns 翻訳失敗用のトーストのカスタムフック
 */
export default function useTranslationFailedToast() {
  const { toast } = useToast();

  return (message: string, onClick: () => void) => {
    toast({
      title: "翻訳失敗",
      description: <p>{`${message}を翻訳できません`}</p>,
      action: (
        <ToastAction altText="やり直す" onClick={onClick}>
          やり直す
        </ToastAction>
      ),
    });
  };
}
