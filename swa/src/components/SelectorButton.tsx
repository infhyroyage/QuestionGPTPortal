import { SelectorButtonProps } from "@/types/props";
import { useMemo } from "react";
import ImageDialog from "./ImageDialog";
import { Button } from "./Button";

/**
 * 選択肢のボタンのコンポーネント
 * @returns 選択肢のボタンのコンポーネント
 */
export default function SelectorButton({
  className,
  disabled,
  idx,
  img,
  onClick,
  sentence,
  translation,
  variant,
}: SelectorButtonProps) {
  // アルファベット表示用の選択肢のインデックスをアルファベットに変換(0->A, 1->B, ...、表示しない場合はnull)
  const alphabet: string | null = useMemo(() => {
    return idx !== undefined ? String.fromCharCode(65 + idx) : null;
  }, [idx]);

  return (
    <Button
      variant={variant}
      className={`relative flex flex-col py-4 pl-4 w-full h-full space-y-1 whitespace-normal text-left items-start${
        className ? ` ${className}` : ""
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {alphabet && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-8xl font-bold text-base-content/25 select-none">
            {alphabet}
          </span>
        </div>
      )}
      <div className="relative z-10 flex flex-col space-y-1 w-full">
        {sentence && (
          <>
            <p className="leading-7">{sentence}</p>
            {translation ? (
              <p className="text-sm text-base-content/60">{translation}</p>
            ) : (
              <div className="skeleton h-5 w-full" />
            )}
          </>
        )}
        {img && <ImageDialog img={img} alt={img} />}
      </div>
    </Button>
  );
}
