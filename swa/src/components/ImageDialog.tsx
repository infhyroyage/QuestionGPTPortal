import { ImageDialogProps } from "@/types/props";
import { ZoomIn } from "lucide-react";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 画像拡大時のダイアログのコンポーネント
 * @returns 画像拡大時のダイアログのコンポーネント
 */
export default function ImageDialog({ img, alt }: ImageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 画像拡大ボタン押下時にダイアログを表示
  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  // 閉じるボタン押下時にダイアログを非表示
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  }, []);

  // ダイアログ背景クリック時にダイアログを非表示
  // 実際のダイアログの閉じる処理はhandleCloseで行う
  const handleBackdropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <>
      <div className="group relative w-fit cursor-pointer" onClick={handleOpen}>
        <img src={img} alt={alt} className="w-auto max-h-[30vh] object-cover" />
        <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-70 transition duration-300" />
        <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 text-white size-[10vh]" />
      </div>
      {isOpen &&
        createPortal(
          <div className="modal modal-open" role="dialog">
            <div
              className="modal-box max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={img} alt={alt} className="w-full h-auto" />
              <button
                type="button"
                onClick={handleClose}
                onMouseDown={handleBackdropMouseDown}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              className="modal-backdrop"
              aria-label="閉じる"
              onClick={handleClose}
              onMouseDown={handleBackdropMouseDown}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
