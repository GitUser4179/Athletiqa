import { useState } from "react";
import { Button } from "../../../shared/ui/button";
import { CheckBox } from "../../../shared/ui/checkbox";
import { FormField } from "../../../shared/ui/input";
import { RadioGroup } from "../../../shared/ui/radio-group";
import useRegisterForm from "../model/useRegisterForm";
import OrganizationToggle from "./OrganizationToggle";
import RoleSwitcher from "./RoleSwitcher";
import { Card } from "../../../shared/ui/card";
import Info from "../../../shared/assets/info.svg?react";
import RegisterFormBackGround from "../../../shared/assets/registerformAndlogin-background.svg?url";
import ScallopIcon from "../../../shared/ui/icons/ScallopIcon";
import { useTranslation } from "react-i18next";
import { registerUser } from "../api/authApi";

// This is the RegisterForm component that renders a form for user registration.s
// It uses the useRegisterForm hook to manage the form state and handle input changes and form submission.
// The form includes fields for name, lastname, email, password, confirm password, a checkbox for organization registration, a checkbox for user agreement, and a role switcher.
function RegisterForm() {
  const { t } = useTranslation();
  const {
    user,
    handleInput,
    handleCheckBox,
    handleRoleChange,
    errors,
    touched,
  } = useRegisterForm();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getFieldState = (fieldName) => ({
    touched: Boolean(touched?.[fieldName]),
    error: errors?.[fieldName] || "",
    isValid:
      Boolean(user[fieldName]) &&
      Boolean(touched?.[fieldName]) &&
      !errors?.[fieldName],
  });

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (user.role === "sponsor" && user.isMinor) {
      setSubmitError(t("En sponsor måste vara över 18 år."));
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(user);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || t("Registreringen misslyckades, försök igen senare"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex justify-center relative overflow-hidden bg-bg items-center min-h-screen" style={{
      backgroundImage: `url("${RegisterFormBackGround}")`,
      backgroundSize: "100% auto",
      backgroundPosition: "center 5rem",
      backgroundRepeat: "no-repeat",
    }}>
      <Card className="w-[36.75rem] py-9 px-7 z-10">
        {isSubmitted && import.meta.env.VITE_SKIP_EMAIL_CONFIRMATION === "true" ? (
          <div className="text-center flex flex-col items-center gap-6 py-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-primary">
              {t("Konto skapat!")}
            </h1>
            <p className="text-gray-700 text-base leading-6 max-w-[30rem]">
              {t("Registreringen lyckades. Du kan logga in direkt.")}
            </p>
            <a href="/login" className="text-base font-medium leading-5 underline underline-offset-8">
              {t("Logga in")}
            </a>
          </div>
        ) : isSubmitted ? (
          <div className="text-center flex flex-col items-center gap-6 py-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-primary">
              {t("E-post skickat!")}
            </h1>
            <p className="text-gray-700 text-base leading-6 max-w-[30rem]">
              {t("Registreringen lyckades. Ett verifieringsmejl har skickats till din e-postadress. Vänligen klicka på länken i mejlet för att aktivera ditt konto.")}
            </p>
            <div className="w-full border-t border-gray-300 my-2"></div>
            <p className="text-sm text-gray-500">
              {t("Kolla din inkorg")}
            </p>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} noValidate className="bg-bg">
            <span className="flex flex-col justify-center items-center">
              <h1 className="text-3xl text-gray-700 font-bold leading-9 mt-2">
                {t("Skapa konto")}
              </h1>
              <p className="text-base text-gray-700 font-normal leading-6 mt-2">
                {t("Har du redan ett konto?")}{" "}
                <a
                  href="/login"
                  className="text-base font-medium leading-5 underline underline-offset-8 mt-2"
                >
                  {t("Logga in")}
                </a>
              </p>
            </span>

            <RoleSwitcher role={user.role} onRoleChange={handleRoleChange} />
            
            <span className="flex flex-col justify-center items-start mt-10 gap-2">
              <OrganizationToggle
                role={user.role}
                isMinor={user.isMinor}
                checked={user.organization}
                onChange={handleCheckBox}
              />
            </span>

          <span className="input-container mt-2">
            {user.organization &&
              !user.isMinor &&
              (user.role === "athlete" || user.role === "sponsor") && (
                <div className="input-container">
                  <FormField
                    label={t(user.role === "athlete" ? "Föreningsnamn" : "Företags namn")}
                    type="text"
                    id="orgName"
                    name="orgName"
                    labelClassName="ml-2"
                    value={user.orgName}
                    onChange={handleInput}
                    required
                    {...getFieldState("orgName")}
                  />

                  <FormField
                    label={t(user.role === "athlete" ? "Föreningsnummer" : "Organisationsnummer")}
                    type="text"
                    inputMode="numeric"
                    id="orgNumber"
                    name="orgNumber"
                    labelClassName="ml-2"
                    value={user.orgNumber}
                    onChange={handleInput}
                    required
                    {...getFieldState("orgNumber")}
                  />
                </div>
              )}
          </span>

          <span className="flex items-center justify-start gap-6 py-2 w-full [&>label]:flex-1 [&>label]:min-w-0">
            <FormField
              label={t("Förnamn")}
              type="text"
              id="name"
              name="name"
              labelClassName="ml-2"
              value={user.name}
              onChange={handleInput}
              required
              {...getFieldState("name")}
            />
            <FormField
              label={t("Efternamn")}
              type="text"
              id="lastName"
              name="lastName"
              labelClassName="ml-2"
              value={user.lastName}
              onChange={handleInput}
              required
              {...getFieldState("lastName")}
            />
          </span>

          <span>
            {user.role === "athlete" && (
              <RadioGroup
                name="gender"
                value={user.gender}
                onChange={handleInput}
                options={[
                  { value: "man", label: t("Man") },
                  { value: "kvinna", label: t("Kvinna") },
                  { value: "other", label: t("Annat") },
                ]}
                required
              />
            )}
          </span>

          <FormField
            label={t("Personnummer")}
            type="text"
            inputMode="numeric"
            id="personNumber"
            name="personNumber"
            labelClassName="ml-2 mt-[1rem]"
            value={user.personNumber}
            onChange={handleInput}
            required
            {...getFieldState("personNumber")}
          />

          <span className="flex flex-1 items-start gap-3 py-4 px-3 w-full bg-accent-light rounded-xl mt-[1rem]">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-gray-700 font-normal text-sm leading-5 max-w-[30rem]">
              {t("Vi använder personnummer för att verifiera din identitet och säkerställa att donationer hanteras tryggt och korrekt. Det hjälper oss att förhindra bedrägerier, skydda både dig och atleterna samt uppfylla krav på säker betalningshantering.")}
            </p>
          </span>

          {user.organization && user.isMinor && user.personNumber && (
            <p className="py-5 text-gray-700 text-base font-medium leading-5">
              {user.role === "athlete"
                ? t("Registrering av förening är endast tillåten för personer över 18 år.")
                : t("Registrering av företag är endast tillåten för personer över 18 år.")}
            </p>
          )}
          {user.isUnderThirteen && user.role === "athlete" && (
            <p className="py-5 text-gray-700 text-base font-medium leading-5">
              {t("Eftersom du är under 13 år behöver din vårdnadshavare registrera dig och ange sina uppgifter för att du ska kunna fortsätta.")}
            </p>
          )}

          {user.role === "athlete" && user.isMinor && (
            <div className="input-container mb-15">
              <h2 className="text-gray-700 text-xl text-semibold leading-7">
                {t("Vårdnadshavare")}
              </h2>
              <span className="flex items-center justify-start gap-10 [&>label]:flex-1 [&>label]:min-w-0">
                <FormField
                  label={t("Förnamn")}
                  type="text"
                  id="guardianName"
                  name="guardianName"
                  labelClassName="ml-2 mt-[1rem]"
                  value={user.guardianName}
                  onChange={handleInput}
                  required
                  {...getFieldState("guardianName")}
                />

                <FormField
                  label={t("Efternamn")}
                  type="text"
                  id="guardianLastname"
                  name="guardianLastname"
                  labelClassName="ml-2 mt-[1rem]"
                  value={user.guardianLastname}
                  onChange={handleInput}
                  required
                  {...getFieldState("guardianLastname")}
                />
              </span>

              <span>
                <p className="text-gray-700 text-base font-normal pl-2 leading-6 mb-[0.8rem]">
                  {t("Din relation")} <span className="text-error text-lg ">*</span>
                </p>
                <RadioGroup
                  name="guardianRelationship"
                  value={user.guardianRelationship}
                  onChange={handleInput}
                  options={[
                    { value: "parent", label: t("Förälder") },
                    { value: "legalGuardian", label: t("Vårdnadshavare") },
                    { value: "sibling", label: t("Syskon") },
                    { value: "other", label: t("Annat") },
                  ]}
                  required
                />
              </span>

              <FormField
                label={t("Personnummer")}
                type="text"
                inputMode="numeric"
                id="guardianPersonNumber"
                labelClassName="ml-2 mt-[1rem]"
                name="guardianPersonNumber"
                value={user.guardianPersonNumber}
                onChange={handleInput}
                {...getFieldState("guardianPersonNumber")}
                required
              />

              <FormField
                label={t("Email")}
                type="email"
                id="guardianEmail"
                name="guardianEmail"
                labelClassName="ml-2 mt-[1rem]"
                value={user.guardianEmail}
                onChange={handleInput}
                {...getFieldState("guardianEmail")}
                required
              />

              <FormField
                label={t("Telefonnummer")}
                type="text"
                inputMode="numeric"
                id="guardianPhoneNumber"
                name="guardianPhoneNumber"
                labelClassName="ml-2 mt-[1rem]"
                value={user.guardianPhoneNumber}
                onChange={handleInput}
                {...getFieldState("guardianPhoneNumber")}
                required
              />
              <div className="relative min-h-[2rem] mt-[1rem]">
                <div className="absolute flex flex-1 items-start gap-3 py-4 px-3 mt-2 w-full bg-accent-light rounded-xl">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-gray-700 font-normal text-sm leading-5 max-w-[30rem]">
                    {t("Det telefonnumer som anges kommet att vara mottagaren för betalningarna som görs i donationer.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!user.isMinor && (
            <FormField
              label={t("Telefonnummer")}
              type="text"
              inputMode="numeric"
              id="phoneNumber"
              name="phoneNumber"
              value={user.phoneNumber || ""}
              labelClassName="ml-2 mt-[1rem]"
              onChange={handleInput}
              required
              {...getFieldState("phoneNumber")}
            />
          )}

          <FormField
            label="Email"
            type="email"
            id="email"
            name="email"
            value={user.email}
            labelClassName="ml-2 mt-[1rem]"
            onChange={handleInput}
            required
            {...getFieldState("email")}
          />

          <FormField
            label={t("Skapa lösenord")}
            type="password"
            id="password"
            name="password"
            labelClassName="ml-2 mt-[1rem]"
            value={user.password}
            onChange={handleInput}
            {...getFieldState("password")}
            required
          />

          <FormField
            label={t("Bekräfta lösenord")}
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            labelClassName="ml-2 mt-[1rem]"
            value={user.confirmPassword}
            onChange={handleInput}
            {...getFieldState("confirmPassword")}
            required
          />

          <div className="checkbox-container mt-4">
            <CheckBox
              name="userAgreement"
              id="user-agreement"
              label={
                <div className="text-sm text-gray-700 font-normal leading-5">
                  {t("Jag godkänner Athletiqas")}{" "}
                  <a
                    href="/login"
                    className="text-sm text-gray-700 font-normal leading-5 underline underline-offset-8"
                  >
                    {t("användarvillkor")}
                  </a>
                </div>
              }
              checked={user.userAgreement}
              onChange={handleCheckBox}
              required
            />
          </div>

          {submitError && (
            <div className="mt-4 p-3 bg-error-light/20 text-error text-sm rounded-xl border border-error/20 text-center font-medium">
              {submitError}
            </div>
          )}

          <div className="button-container mt-[2.25rem]">
            <Button
              variant="none"
              type="submit"
              disabled={isLoading}
              className="group relative overflow-hidden w-full bg-primary text-bg text-lg font-semibold leading-6 disabled:opacity-50"
            >
              <span className="absolute inset-x-0 bottom-0 z-0 h-[9rem] translate-y-full transition-transform duration-1000 ease-out group-hover:translate-y-[1.2rem]">
                <ScallopIcon className="absolute left-0 z-10 w-full h-auto top-0 text-accent" />
                <span className="absolute inset-x-0 bottom-0 z-0 h-[4.5rem] bg-accent" />
              </span>

              <span className="relative z-10 transition-colors duration-500 group-hover:text-primary">
                {isLoading ? t("Skapar konto...") : t("Skapa Konto")}
              </span>
            </Button>
          </div>
        </form>
      )}
      </Card>
    </main>
  );
}

export default RegisterForm;