import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { CopySheetMarkdownProps } from "@/types/props";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * コピー用シートの見出し・Markdown形式の文字列・コピーボタンのコンポーネント
 * @returns コピー用シートの見出し・Markdown形式の文字列・コピーボタンのコンポーネント
 */
export default function CopySheetMarkdown({
  markdown,
  title,
}: CopySheetMarkdownProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const systemErrorToast = useSystemErrorToast();

  // コピー完了表示を2秒間表示した後に元に戻す
  useEffect(() => {
    if (!isCopied) return;
    const timeoutId = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  const onClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
    } catch (e) {
      systemErrorToast(e);
    }
  }, [markdown, systemErrorToast]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 my-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {title}
        </h4>
        <button
          type="button"
          className={`btn btn-sm shrink-0 ${isCopied ? "btn-success" : "btn-primary"}`}
          onClick={onClick}
        >
          {isCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
      <textarea
        className="textarea w-full h-60 font-mono text-sm"
        aria-label={title}
        readOnly
        value={markdown}
      />
    </>
  );
}
