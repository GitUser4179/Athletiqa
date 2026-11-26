import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/ui/button";
import { ContactIcon } from "../../../shared/assets";
import { useMessageStore } from "../../../shared/model/useMessageStore";
import { startConversation } from "../../../enteties/message";

// "Kontakta" button on public profiles: opens (or creates) the conversation with that user
// and shows it in the chat panel. Guests are sent to login first.
// type: "athlete" | "sponsor"
export function ContactButton({ type, publicProfileId, isAuthenticated = false, className = "" }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const openChatWith = useMessageStore((s) => s.openChatWith);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const conversation = await startConversation(type, publicProfileId);
      openChatWith(conversation);
    } catch (err) {
      console.error(err);
      setError(t("Kunde inte öppna konversationen."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className={`px-5 py-2 rounded-xl font-medium flex items-center gap-2 ${className}`}
      >
        {t("Kontakta")}
        <ContactIcon className="w-4 h-4 inline-block" />
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
