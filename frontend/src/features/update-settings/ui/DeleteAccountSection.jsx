import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import { Modal } from "../../../shared/ui/modal";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../shared/lib/useAuth";
import { deleteAccount } from "../api/settingsApi";

// Danger zone. Sits at the bottom of the profile + security tabs.
// Lives outside any form so submitting a form can't trigger it.
export default function DeleteAccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await deleteAccount();
      // The server already signed us out; this clears the local login state
      await logout().catch(() => {});
      setShowConfirm(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError(t("Kunde inte radera kontot, försök igen."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-primary">{t("Radera konto")}</h2>
      <p className="text-sm text-gray-700">
        {t("När du raderar ditt konto försvinner din profil, dina bilder, meddelanden och all annan data permanent. Du kan inte återställa kontot efteråt.")}
      </p>
      <Button
        variant="danger"
        onClick={() => setShowConfirm(true)}
        className="w-fit px-6 py-3 font-medium"
      >
        {t("Radera konto")}
      </Button>

      {/* Confirm delete */}
      <Modal isOpen={showConfirm} onClose={() => !isDeleting && setShowConfirm(false)}>
        <div className="p-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-primary text-center">
            {t("Är du säker på att du vill lämna laget?")}
          </h2>
          <div className="text-sm text-gray-700 text-center flex flex-col gap-2">
            <p className="font-bold">
              {t("Ditt konto raderas direkt, tillsammans med din profil, dina inlägg, kommentarer och meddelanden. Det går inte att ångra.")}
            </p>
            <p>
              {t("Donationer du har gjort finns kvar på insamlingarna, men visas som anonyma.")}
            </p>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex flex-col gap-3">
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full py-3 font-medium"
            >
              {isDeleting ? t("Raderar…") : t("Radera konto")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="w-full py-3 font-medium"
            >
              {t("Avbryt")}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
