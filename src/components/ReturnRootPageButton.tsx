import { basePath } from "@/lib/github";
import { CornerDownLeft } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export default function ReturnRootPageButton() {
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    navigate(`${basePath}/`);
  }, [navigate]);

  return (
    <Button onClick={onClick} variant="outline" size="icon">
      <CornerDownLeft />
    </Button>
  );
}
