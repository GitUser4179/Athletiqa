import { Link } from "react-router-dom";

// Big action card on the dashboard. Navigates to `href`, or runs `onClick` instead when given
// (e.g. "Meddelanden" opens the chat panel rather than a page).
export default function DashboardHeroActionCard({
  label,
  href,
  onClick,
  icon: Icon,
  primary = false,
}) {
  const className = [`w-[17rem] h-[5.5 rem] relative py-5 px-8 flex flex-col
      items-center justify-center  rounded-xl border  leading-6
       no-underline transition-colors duration-500 ease-out cursor-pointer `, primary?  "border-primary bg-primary text-bg hover:bg-primary-light hover:text-primary hover:border-transparent": "border-primary bg-bg text-primary  hover:bg-accent hover:border-transparent"
      ].join('');

  const content = (
    <>
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span className="text-center mt-">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}
