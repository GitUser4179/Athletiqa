import { FormField } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { Switch } from "../../../shared/ui/switch";
import { Alert } from "../../../shared/ui/alert";
import { FormActions } from "../../../shared/ui/form-actions";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DeleteAccountSection } from "../ui";
import { useFormState } from "../../../shared/lib/";
import { BlockedUsersModal } from "../ui";
import { checkRole } from "../../../shared/lib";
import { ConnectStripeButton } from "../../connect-stripe-account/ui";
import { getPrivacy, updatePrivacy, changePassword } from "../api/settingsApi";

// Password fields start empty; the anonymous flag is loaded from the API.
const initialState = {
  anonymous: false,
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// Identity's password error codes -> what to tell the user
const PASSWORD_RULE_CODES = [
  "PasswordTooShort",
  "PasswordRequiresNonAlphanumeric",
  "PasswordRequiresDigit",
  "PasswordRequiresLower",
  "PasswordRequiresUpper",
  "PasswordRequiresUniqueChars",
];

export default function SecuritySettingsForm() {
  const { values: state, setField, handleChange } = useFormState(initialState);
  const { t } = useTranslation();
  const [blockedOpen, setBlockedOpen] = useState(false);
  const { role } = checkRole();

  // Saved anonymity value from the server (the toggle compares against it)
  const [savedAnonymous, setSavedAnonymous] = useState(false);
  const [anonymousMessage, setAnonymousMessage] = useState({ text: "", type: "" });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    getPrivacy()
      .then(({ anonymous }) => {
        setSavedAnonymous(Boolean(anonymous));
        setField("anonymous", Boolean(anonymous));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAnonymous = (next) => {
    setAnonymousMessage({ text: "", type: "" });
    setField("anonymous", next);
  };

  // Save/cancel show when the anonymous flag differs from the saved value.
  const anonymousDirty = state.anonymous !== savedAnonymous;

  const handleAnonymousSubmit = async (e) => {
    e.preventDefault();
    try {
      const { anonymous } = await updatePrivacy(state.anonymous);
      setSavedAnonymous(Boolean(anonymous));
      setAnonymousMessage({ text: t("Inställningen är sparad."), type: "success" });
    } catch {
      setAnonymousMessage({ text: t("Kunde inte spara, försök igen."), type: "error" });
    }
  };

  const handleAnonymousCancel = () => {
    setField("anonymous", savedAnonymous);
  };

  // Save/cancel only show when at least one password field has text.
  const passwordDirty =
    state.currentPassword || state.newPassword || state.confirmPassword;

  const clearPasswordFields = () => {
    setField("currentPassword", "");
    setField("newPassword", "");
    setField("confirmPassword", "");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: "", type: "" });

    if (!state.currentPassword || !state.newPassword) {
      setPasswordMessage({ text: t("Fyll i nuvarande och nytt lösenord."), type: "error" });
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      setPasswordMessage({ text: t("Lösenorden matchar inte varandra"), type: "error" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePassword(state.currentPassword, state.newPassword);
      clearPasswordFields();
      setPasswordMessage({ text: t("Lösenordet är ändrat."), type: "success" });
    } catch (err) {
      const codes = err.codes ?? [];
      let text = t("Kunde inte ändra lösenordet, försök igen.");
      if (codes.includes("PasswordMismatch")) {
        text = t("Nuvarande lösenord är fel.");
      } else if (codes.some((c) => PASSWORD_RULE_CODES.includes(c))) {
        text = t("Lösenordet måste vara minst 6 tecken och innehålla stor och liten bokstav, en siffra och ett specialtecken.");
      }
      setPasswordMessage({ text, type: "error" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    clearPasswordFields();
    setPasswordMessage({ text: "", type: "" });
  };

  const messageClass = (type) => (type === "error" ? "text-sm text-red-600" : "text-sm text-green-700");

  return (
    <div className="flex flex-col gap-10">
      <h1 className="hidden lg:block text-2xl font-bold text-primary">{t("Säkerhet")}</h1>

      {/* Anonymity toggle + info card */}
      <form onSubmit={handleAnonymousSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Switch checked={state.anonymous} onChange={toggleAnonymous} />
          <span className="text-sm text-gray-700">{t("Jag vill vara anonym")}</span>
        </div>

        <Alert>
          {t("Om du väljer att vara anonym visas varken ditt namn eller din bild på dina kommentarer och donationer. Sponsorer som är anonyma har ingen publik profil.")}
          <br />
          {t("Att vara anonym minskar dock chansen att bli sponsrad, eftersom sponsorer oftast vill veta vem de donerar pengar till.")}
        </Alert>

        {anonymousMessage.text && <p className={messageClass(anonymousMessage.type)}>{anonymousMessage.text}</p>}

        <FormActions show={anonymousDirty} onCancel={handleAnonymousCancel} />
      </form>

      {/*Show Stripe-Connect Button if user is Athlete*/}
      {role === "Athlete" && (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              {t("För att kunna ta emot sponsring och utbetalningar behöver du koppla ditt konto till Stripe. Stripe används för att hantera betalningar på ett säkert sätt.")}
            </p>
            <ConnectStripeButton></ConnectStripeButton>
        </div>
      )}

      {/* Blocked users */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-primary">{t("Blockerade användare")}</h2>
        <p className="text-sm text-gray-700">
          {t("Hantera listan över användare du har blockerat. Blockerade användare kan inte se din profil, dina inlägg eller skicka meddelanden till dig.")}
        </p>
        <Button
          variant="outline"
          onClick={() => setBlockedOpen(true)}
          className="w-fit px-6 py-3 font-medium"
        >
          {t("Se listan")}
        </Button>
      </section>

      {/* Change password */}
      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-primary">{t("Ändra lösenord")}</h2>

        <FormField
          label={t("Nuvarande lösenord")}
          type="password"
          name="currentPassword"
          value={state.currentPassword}
          onChange={handleChange}
        />

        <Link to="/forgot-password" className="text-sm text-gray-700 underline w-fit">
          {t("Glömt lösenord?")}
        </Link>

        <FormField
          label={t("Nytt lösenord")}
          type="password"
          name="newPassword"
          value={state.newPassword}
          onChange={handleChange}
        />

        <FormField
          label={t("Bekräfta nytt lösenord")}
          type="password"
          name="confirmPassword"
          value={state.confirmPassword}
          onChange={handleChange}
        />

        {passwordMessage.text && <p className={messageClass(passwordMessage.type)}>{passwordMessage.text}</p>}

        <FormActions
          show={!!passwordDirty && !isSavingPassword}
          submitLabel={t("Spara nytt lösenord")}
          onCancel={handlePasswordCancel}
        />
      </form>

      <DeleteAccountSection />

      <BlockedUsersModal
        isOpen={blockedOpen}
        onClose={() => setBlockedOpen(false)}
      />
    </div>
  );
}
