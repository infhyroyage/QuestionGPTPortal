import { basePath } from "@/lib/github";
import { CornerDownLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export default function ReturnRootPageButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(`${basePath}/`)}
      variant="outline"
      size="icon"
    >
      <CornerDownLeft />
    </Button>
  );
}
