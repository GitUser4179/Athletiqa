import { useState } from "react";
import { useLikePost } from "../../../features/like-post";
import { CreateCampaignCard } from "../../../features/create-campaign";
import { CreatePostCard } from "../../../features/create-post";
import { CampaignCard } from "../../../enteties/campaign";
import { PostCard } from "../../../enteties/post";
import { StatCard } from "../../../widgets/athlete-profile-header";
import { PostModal } from "../../../widgets/post-modal";
import { Avatar } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import { Chip } from "../../../shared/ui/chip";
import { Tabs } from "../../../shared/ui/tabs";
import { useTranslation } from "react-i18next";

// Athlete's own profile view (the logged-in athlete).
// Two tabs: Insamlingar (campaigns) and Inlägg (posts).
// Each tab handles three states: empty, only one half populated, both populated.
export default function LoggedInAthleteProfile({
  container,
  athlete,
  activeCampaigns,
  finishedCampaigns,
  visiblePosts,
  isAuthenticated = true,
}) {
  // Active tab toggle, "campaigns" or "posts"
  const [activeTab, setActiveTab] = useState("campaigns");

  // Which post the user clicked on, drives the PostModal
  const [activePost, setActivePost] = useState(null);

  // Like/unlike handler shared by all PostCards + the modal
  const { handleToggleLike } = useLikePost();
  const { t } = useTranslation();

  return (
    <>
      {/* Top section, avatar + name + sports + bio + follower stats */}
      <section className={`${container} pt-8 pb-12 flex flex-col items-center text-center md:text-left md:items-start md:flex-row justify-between gap-8`}>
        <div className="flex flex-col items-center md:items-start md:flex-row gap-6 flex-1 min-w-0 w-full">
          <Avatar
            src={athlete.photoUrl}
            alt={athlete.name}
            size="xl"
            fallback={athlete.gender}
            className="!w-32 !h-32 md:!w-44 md:!h-44 flex-shrink-0"
          />

          <div className="flex-1 min-w-0 flex flex-col items-center md:items-start gap-6 w-full">
            <div className="flex flex-col gap-4 w-full">
              <h1 className="text-xl text-primary font-bold">{athlete.name}</h1>

              <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                {athlete.sports.map((sport) => (
                  <Chip key={sport}>{sport}</Chip>
                ))}
              </div>
            </div>

            {/* Bio, existing text or "add bio" CTA */}
            {athlete.bio ? (
              <p className="max-w-[36rem] text-sm text-gray-700 leading-6">
                {athlete.bio}
              </p>
            ) : (
              <Button
                variant="ghost"
                className="w-fit text-primary text-base font-medium hover:underline mx-auto md:mx-0"
              >
                {t("Lägg till biografi +")}
              </Button>
            )}
          </div>
        </div>

        {/* Follower / following stats sitting to the right */}
        <aside className="w-full sm:w-[17.75rem] flex gap-3 justify-center flex-shrink-0">
          <StatCard value={athlete.followers} label={t("Följare")} className="flex-1" />
          <StatCard value={athlete.following} label={t("Följer")} className="flex-1" />
        </aside>
      </section>

      {/* Divider line under the profile section */}
      <div className={`${container} flex-shrink-0`}>
        <div className="h-px bg-gray-300" />
      </div>

      {/* Tab switcher */}
      <div className={`${container} pt-6 pb-10 flex items-center justify-center w-full`}>
        <Tabs
          active={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "campaigns", label: t("Insamlingar") },
            { id: "posts", label: t("Inlägg") },
          ]}
          className="w-full max-w-[24rem]"
          itemClassName="flex-1 px-4 sm:px-8 py-4 text-base text-center"
        />
      </div>

      {/* Campaigns tab */}
      {activeTab === "campaigns" && (
        <>
          {/* Empty state, no active or finished campaigns yet */}
          {activeCampaigns.length === 0 && finishedCampaigns.length === 0 ? (
            <section className={`${container} pb-12 flex flex-col gap-6 items-center md:items-start`}>
              <h2 className="text-2xl md:text-3xl font-semibold text-primary leading-9 text-center md:text-left">
                {t("Du har inga aktiva insamlingar än")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Onboarding card explaining what donations are*/}
                <div className="rounded-xl bg-accent-light px-6 sm:px-12 py-10 flex items-center justify-center text-center min-h-[19.5rem]">
                  <div className="max-w-[28rem] flex flex-col gap-6">
                    <h3 className="text-primary text-xl md:text-2xl font-semibold leading-8">
                      {t("Behöver du stöd i din idrottssatsning?")}
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-7">
                      {t("Skapa en ny insamling där du kan be om stöd för allt som rör ditt idrottsliv – från utrustning till resor och matchbiljetter.")}
                    </p>
                  </div>
                </div>

                <CreateCampaignCard className="w-full min-h-[22rem] md:min-h-[27rem]" />
              </div>
            </section>
          ) : (
            <>
              {/* Active campaigns, single card per the "one active at a time" rule */}
              {activeCampaigns.length > 0 && (
                <section className={`${container} pb-12 flex flex-col gap-6`}>
                  <h2 className="text-2xl md:text-3xl font-semibold text-primary leading-9 text-center md:text-left">
                    {t("Dina aktiva insamlingar")}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <CampaignCard campaign={activeCampaigns[0]} className="w-full" />
                  </div>
                </section>
              )}

              {/* Completed campaigns grid */}
              {finishedCampaigns.length > 0 && (
                <section className={`${container} pb-16 flex flex-col gap-6`}>
                  <h2 className="text-2xl md:text-3xl font-semibold leading-9 text-center md:text-left">
                    <span className="text-gray-700">
                      {t("Dina färdiga insamlingar")}
                    </span>
                    <span className="text-primary">
                      {" "}
                      - {finishedCampaigns.length}st
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {finishedCampaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.campaignId ?? campaign.id}
                        campaign={campaign}
                        className="w-full"
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Posts tab */}
      {activeTab === "posts" && (
        <section className={`${container} pb-16 flex flex-col gap-6`}>
          <h2 className="text-2xl md:text-3xl font-semibold text-primary leading-9 text-center md:text-left">
            {visiblePosts.length === 0
              ? t("Du har inga inlägg än")
              : t("Dina inlägg")}
          </h2>

          {/* Empty state, shows the onboarding card + create-post card side by side */}
          {visiblePosts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="rounded-xl bg-accent-light px-6 sm:px-8 py-10 flex items-center justify-center text-center min-h-[22rem] md:min-h-[25rem]">
                <div className="flex flex-col gap-6">
                  <h3 className="text-primary text-xl md:text-[2rem] font-semibold leading-8 md:leading-[2.5rem]">
                    {t("Vill du dela något med din community?")}
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 leading-7">
                    {t("Med inlägg kan du dela dina erfarenheter och dina prestationer - och även mer!")}
                  </p>
                </div>
              </div>

              <CreatePostCard className="w-full" />
            </div>
          ) : (
            /* Populated state, create-post card first, then the user's posts */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start w-full">
              <CreatePostCard className="w-full" />
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.postId ?? post.id}
                  post={post}
                  onOpen={() => setActivePost(post)}
                  onToggleLike={handleToggleLike}
                  isOwnPost={true}
                  isAuthenticated={isAuthenticated}
                  className="w-full"
                />
              ))}
            </div>
          )}
        </section>
      )}

      <PostModal
        post={activePost}
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        onToggleLike={handleToggleLike}
        isOwnPost={true}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}