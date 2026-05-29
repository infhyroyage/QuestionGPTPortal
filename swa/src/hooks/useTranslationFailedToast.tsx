import { useToast } from "@/hooks/use-toast";

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
        <button type="button" className="btn btn-sm" onClick={onClick}>
          やり直す
        </button>
      ),
    });
  };
}
