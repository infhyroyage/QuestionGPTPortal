import { useToast } from "@/hooks/use-toast";

/**
 * システムエラー用のトーストのカスタムフック
 * @returns システムエラー用のトーストのカスタムフック
 */
export default function useSystemErrorToast() {
  const { toast } = useToast();

  return (e: unknown) => {
    console.error(e);
    toast({
      variant: "destructive",
      title: "システムエラー",
      description: (
        <>
          <p>以下をシステム管理者にご連絡ください</p>
          <p>{String(e)}</p>
        </>
      ),
    });
  };
}
