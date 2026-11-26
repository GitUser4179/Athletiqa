import { CampaignCard } from "../../../enteties/campaign";
import { Avatar } from "../../../shared/ui/avatar";
import { Chip } from "../../../shared/ui/chip";
import { UserActionsMenu } from "../../../features/block-user";
import { ContactButton } from "../../../features/contact-user";
import { useTranslation } from "react-i18next";

// Sponsor's public profile view (viewed by anyone other than the sponsor themself).
// Shows the Kontakta + more-actions buttons instead of follower stats.
// No tabs, just two stacked sections, medaljer + sista donationer.
export default function PublicSponsorProfile({
  container,
  sponsor,
  medals,
  donations,
  isAuthenticated,
}) {
  const { t } = useTranslation();
  const highestUnlockedMedal = medals.filter((medal) => medal.unlocked).at(-1);
  return (
    <>
      {/* Top section, avatar + name + actions + sports + bio */}
      <section className={`${container} pt-8 pb-12 flex items-start gap-6`}>
        <Avatar
          src={sponsor.photoUrl}
          alt={sponsor.name}
          size="xl"
          fallback="company"
          className="!w-44 !h-44 flex-shrink-0"
        />

        <div className="flex-1 max-w-[50rem] flex flex-col gap-6">
          {/* Name + sponsor badge + action buttons row */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl text-primary">{sponsor.name}</h1>
            {highestUnlockedMedal ? (
              <img
                src={highestUnlockedMedal.iconUrl}
                alt={highestUnlockedMedal.name}
                className="w-8 h-8 rounded-full"
              />
            ) : null}

            {!sponsor.isOwnProfile && (
              <>
                <ContactButton
                  type="sponsor"
                  publicProfileId={sponsor.publicProfileId}
                  isAuthenticated={isAuthenticated}
                />

                {/* More-actions menu (block) */}
                <UserActionsMenu
                  user={{ type: "sponsor", publicProfileId: sponsor.publicProfileId, name: sponsor.name }}
                  isAuthenticated={isAuthenticated}
                />
              </>
            )}
          </div>

          {/* Sport chips */}
          <div className="flex gap-3 flex-wrap">
            {(sponsor.sports ?? []).map((sport) => (
              <Chip key={sport}>{sport}</Chip>
            ))}
          </div>

          {/* Quote bio + bullet points */}
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            {sponsor.quote ? <p>“{sponsor.quote}”</p> : null}
            {sponsor.bioPoints?.length > 0 ? (
              <ul className="list-disc ml-6">
                {sponsor.bioPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {/* Divider line under the profile section */}
      <div className={`${container} h-px bg-gray-300 flex-shrink-0`} />

      {/* Medals section, full grid of earned + locked badges */}
      <section className={`${container} pt-12 pb-12 flex flex-col gap-6`}>
        <h2 className="text-3xl font-semibold text-primary leading-9">
          {t("{{name}}s medaljer", { name: sponsor.name, defaultValue: "{{name}}s medaljer" })}
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {medals.map((medal) => (
            <article
              key={medal.medalId}
              className="flex items-center gap-6 p-6 rounded-xl border border-gray-300 bg-surface"
            >
              <img
                src={medal.iconUrl}
                alt=""
                className={`w-20 h-20 rounded-full flex-shrink-0 ${
                  medal.unlocked ? "" : "grayscale opacity-50"
                }`}
              />
              <div className="flex flex-col gap-2 min-w-0">
                <h3 className="text-lg font-bold text-primary">{medal.name}</h3>
                <p className="text-sm text-gray-700">{medal.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recent donations section, campaigns the sponsor has contributed to */}
      <section className={`${container} pb-16 flex flex-col gap-6`}>
        <h2 className="text-3xl font-semibold text-primary leading-9">
          {t("{{name}}s sista donationer", { name: sponsor.name, defaultValue: "{{name}}s sista donationer" })}
        </h2>

        {donations.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {donations.map((d) => (
              <CampaignCard
                key={d.donationId}
                campaign={{ ...d.campaign, donationAmount: d.amount }}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[36rem]">
            <p className="text-sm text-gray-700 leading-6">
              Sponsorn har inte gjort några donationer ännu.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
