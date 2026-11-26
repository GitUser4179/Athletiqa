import { useState } from "react";
import { Modal } from "../../../shared/ui/modal";
import { Button } from "../../../shared/ui/button";
import { useTranslation } from "react-i18next";
import { blockUser } from "../api/blockApi";

// Confirmation modal for "Blockera" (from a profile's or comment's ⋯ menu).
// `user` is { type: "athlete" | "sponsor", publicProfileId, name }.
export function BlockUserModal({ isOpen, onClose, user, onConfirm }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBlock = async () => {
    if (!user?.type || !user?.publicProfileId) return;
    setIsLoading(true);
    setError("");
    try {
      await blockUser(user.type, user.publicProfileId);
      onClose();
      if (onConfirm) onConfirm(user);
    } catch (err) {
      console.error(err);
      setError(t("Kunde inte blockera användaren, försök igen."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-md">
      <div className="p-8 flex flex-col gap-6">
        {/* Title */}
        <h2 className="text-2xl font-bold text-primary text-center">
          {t("Blockera användare")}
        </h2>

        {/* Explanation of what blocking does */}
        <p className="text-sm text-gray-700 text-center">
          {t("Blockerade användare kan inte se din profil, dina inlägg eller skicka meddelanden till dig.")}
        </p>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* Confirm + cancel buttons stacked */}
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={handleBlock}
            disabled={isLoading}
            className="w-full py-3 font-medium !bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
          >
            {t("Blockera användare")}
          </Button>

          <Button
            variant="none"
            onClick={onClose}
            className="w-full py-3 font-medium text-gray-700 hover:text-primary"
          >
            {t("Avbryt")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
