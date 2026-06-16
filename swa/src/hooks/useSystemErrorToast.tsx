import useToast from "@/hooks/useToast";

/**
 * システムエラー用のトーストのカスタムフック
 * @returns システムエラー用のトーストのカスタムフック
 */
export default function useSystemErrorToast() {
  const toast = useToast();

  return (e: unknown) => {
    console.error(e);
    toast({
      variant: "error",
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
