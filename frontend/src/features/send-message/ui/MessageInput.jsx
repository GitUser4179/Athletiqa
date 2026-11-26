import { useState } from "react";
import { sendMessage } from "../api/messageApi";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { useTranslation } from "react-i18next";

// Quick replies are just buttons that send a predfined message when clicked, as defined by the figma design. 
// They are optional one click buttons
const QUICK_REPLIES = ["Tack!", "Hej!", "Jag svarar senare"];

// Takes the current conversationId
// Backend figures out who's sending based on the logged-in user cookie, so we don't need to pass senderId
function MessageInput({ conversationId }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return; // Don't send empty messages
    setError("");
    try {
      await sendMessage(conversationId, content);
      setContent(""); // Clear input after sending
    } catch (err) {
      console.error(err);
      setError(t("Meddelandet kunde inte skickas."));
    }
  }

  function handleQuickReply(text) {
    setError("");
    sendMessage(conversationId, text).catch((err) => {
      console.error(err);
      setError(t("Meddelandet kunde inte skickas."));
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-2 overflow-x-auto pb-1 w-full scrollbar-none">
        
        {QUICK_REPLIES.map((text) => ( 
          <button
            key={text}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-300 text-gray-500 hover:border-primary hover:text-primary bg-bg whitespace-nowrap transition-all cursor-pointer"
            onClick={() => handleQuickReply(text)}
          >
            {text}
          </button>
        ))}
      </div>  
      {error && <p className="text-xs text-red-600">{error}</p>}
      <form onSubmit={handleSend} className="flex gap-2 items-center w-full">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("Skriv ett meddelande...")}
          className="w-full text-xs"
        />
        <Button 
          type="submit"
          variant="primary"
          size="default"
          className="shrink-0"
        >
            {t("Skicka")}
      </Button>
      </form>
    </div>
  );
}

export default MessageInput;