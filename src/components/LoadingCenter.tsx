import { Loader2 } from "lucide-react";

export default function LoadingCenter() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={150} className="animate-spin" />
    </div>
  );
}
