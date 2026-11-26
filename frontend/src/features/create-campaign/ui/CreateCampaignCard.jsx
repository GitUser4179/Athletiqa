import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import { useTranslation } from "react-i18next";

export function CreateCampaignCard({ className = "flex-1" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Button
      variant="dashed"
      onClick={() => navigate("/create-post?tab=campaign")}
      className={`!rounded-xl ${className} flex flex-col items-center justify-center gap-4`}
    >
      <span className="w-14 h-14 flex items-center justify-center border-2 border-gray-700 rounded-md text-3xl text-gray-700">
        +
      </span>
      <span className="text-xl text-gray-700">{t("Skapa en ny insamling")}</span>
    </Button>
  );
}