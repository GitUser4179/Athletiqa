import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";

function ErrorContent({ code, title, text }) {
  const { t } = useTranslation();
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-7xl font-bold text-primary-light font-heading" aria-hidden="true">{code}</p>
      <h1 className="text-3xl font-bold text-primary">{title}</h1>
      <p className="max-w-md text-gray-700">{text}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-primary text-bg font-medium no-underline hover:bg-primary-light hover:text-primary transition-colors"
        >
          {t("Till startsidan")}
        </Link>
        <Link
          to="/explore"
          className="px-6 py-3 rounded-xl border border-primary text-primary font-medium no-underline hover:bg-accent hover:border-transparent transition-colors"
        >
          {t("Utforska")}
        </Link>
      </div>
    </section>
  );
}

// Shown for every URL that doesn't match a route (rendered inside the normal layout)
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <ErrorContent
      code="404"
      title={t("Sidan finns inte")}
      text={t("Sidan du letar efter har flyttats, tagits bort eller har aldrig funnits.")}
    />
  );
}

// errorElement for the router: replaces React Router's developer error screen
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  console.error(error);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <ErrorContent
      code=":("
      title={t("Något gick fel")}
      text={t("Ett oväntat fel uppstod. Försök ladda om sidan eller gå tillbaka till startsidan.")}
    />
  );
}
