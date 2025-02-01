import { useToast } from "@/hooks/ui/use-toast";

export default function useSystemErrorToast() {
  const { toast } = useToast();

  return (e: unknown) => {
    console.error(e);
    toast({
      variant: "destructive",
      title: "システムエラーが発生しました",
      description: (
        <>
          <p>以下をシステム管理者にご連絡ください</p>
          <p>{String(e)}</p>
        </>
      ),
    });
  };
}
