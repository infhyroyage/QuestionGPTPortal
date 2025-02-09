import { SelectorButtonProps } from "@/types/props";
import ImageDialog from "./ImageDialog";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

/**
 * 選択肢のボタンのコンポーネント
 * @returns 選択肢のボタンのコンポーネント
 */
export default function SelectorButton({
  className,
  disabled,
  img,
  onClick,
  sentence,
  translation,
  variant,
}: SelectorButtonProps) {
  return (
    <Button
      variant={variant}
      className={`flex flex-col py-4 pl-4 w-full h-full space-y-1 whitespace-normal text-left items-start${
        className ? ` ${className}` : ""
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <p className="leading-7">{sentence}</p>
      {translation ? (
        <p className="text-sm text-muted-foreground">{translation}</p>
      ) : (
        <Skeleton className="h-5 w-full" />
      )}
      {img && <ImageDialog img={img} alt={sentence} />}
    </Button>
  );
}
