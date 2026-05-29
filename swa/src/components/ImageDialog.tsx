import { ImageDialogProps } from "@/types/props";
import { ZoomIn } from "lucide-react";
import { useId } from "react";

/**
 * 画像拡大時のダイアログのコンポーネント
 * @returns 画像拡大時のダイアログのコンポーネント
 */
export default function ImageDialog({ img, alt }: ImageDialogProps) {
  const modalId = useId();

  return (
    <>
      <div className="inline-block" onClick={(e) => e.stopPropagation()}>
        <label
          htmlFor={modalId}
          className="group relative inline-block cursor-pointer"
        >
          <img
            src={img}
            alt={alt}
            className="w-auto max-h-[30vh] object-cover"
          />
          <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-70 transition duration-300" />
          <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 text-white size-[10vh]" />
        </label>
      </div>
      <input type="checkbox" id={modalId} className="modal-toggle" />
      <div className="modal" role="dialog">
        <div
          className="modal-box max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={img} alt={alt} className="w-full h-auto" />
          <label
            htmlFor={modalId}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            aria-label="閉じる"
          >
            ✕
          </label>
        </div>
        <label className="modal-backdrop" htmlFor={modalId}>
          閉じる
        </label>
      </div>
    </>
  );
}
