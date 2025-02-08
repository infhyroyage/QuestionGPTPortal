import { DialogDescription } from "./ui/dialog";

import { ImageDialogProps } from "@/types/props";
import { ZoomIn } from "lucide-react";
import ImageDialogContent from "./ImageDialogContent";
import { Dialog, DialogTitle, DialogTrigger } from "./ui/dialog";

/**
 * 画像拡大時のダイアログのコンポーネント
 * @returns 画像拡大時のダイアログのコンポーネント
 */
export default function ImageDialog({ img, alt }: ImageDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          onClick={(e) => e.stopPropagation()}
          className="group relative inline-block"
        >
          <img
            src={img}
            alt={alt}
            className="w-auto max-h-[30vh] object-cover"
          />
          <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-70 transition duration-300" />
          <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 text-white size-[10vh]" />
        </div>
      </DialogTrigger>
      <ImageDialogContent>
        <DialogTitle />
        <DialogDescription />
        <img src={img} alt={alt} />
      </ImageDialogContent>
    </Dialog>
  );
}
