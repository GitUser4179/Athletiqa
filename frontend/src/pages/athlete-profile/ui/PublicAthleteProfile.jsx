import { useState } from "react";
import { useLikePost } from "../../../features/like-post";
import { FollowButton } from "../../../features/follow-athlete";
import { CampaignCard } from "../../../enteties/campaign";
import { PostCard } from "../../../enteties/post";
import { PostModal } from "../../../widgets/post-modal";
import { Avatar } from "../../../shared/ui/avatar";
import { Chip } from "../../../shared/ui/chip";
import { UserActionsMenu } from "../../../features/block-user";
import { ContactButton } from "../../../features/contact-user";
import { useTranslation } from "react-i18next";

// Athlete's public profile view (viewed by anyone other than the athlete themself).
// Shows action buttons (Follow / Kontakta / ⋯) instead of follower stat cards.
// No tabs, just two stacked sections: active campaigns + posts.
export default function PublicAthleteProfile({
  container,
  athlete,
  activeCampaigns,
  visiblePosts,
  isAuthenticated,
}) {
  const { t } = useTranslation();
  // Which post the user clicked on, drives the PostModal
  const [activePost, setActivePost] = useState(null);

  // Like/unlike handler shared by all PostCards and the modal
  const { handleToggleLike } = useLikePost();

  return (
    <>
      {/* Top section, avatar + name + actions + sports + bio */}
      <section className={`${container} pt-8 pb-12 flex flex-col items-center text-center md:text-left md:items-start md:flex-row gap-6`}>
        <Avatar
          src={athlete.photoUrl}
          alt={athlete.name}
          size="xl"
          fallback={athlete.gender}
          className="!w-32 !h-32 md:!w-44 md:!h-44 flex-shrink-0"
        />

        <div className="flex-1 w-full max-w-[50rem] flex flex-col items-center md:items-start gap-6">
          {/* Name + action buttons row */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 w-full">
            <h1 className="text-xl text-primary font-bold">{athlete.name}</h1>

            {/* Actions are hidden when an athlete views their own public profile */}
            {!athlete?.isOwnProfile && (
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                <FollowButton
                  athleteId={athlete?.publicProfileId}
                  initialIsFollowing={athlete?.isFollowing}
                  isAuthenticated={isAuthenticated}
                />

                <ContactButton
                  type="athlete"
                  publicProfileId={athlete?.publicProfileId}
                  isAuthenticated={isAuthenticated}
                />

                {/* More-actions menu (block) */}
                <UserActionsMenu
                  user={{ type: "athlete", publicProfileId: athlete.publicProfileId, name: athlete.name }}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            )}
          </div>

          {/* Sport chips */}
          <div className="flex gap-3 flex-wrap justify-center md:justify-start">
            {(athlete.sports ?? []).map((sport) => (
              <Chip key={sport}>{sport}</Chip>
            ))}
          </div>

          {/* Bio (skipped entirely if the athlete hasn't added one) */}
          {athlete.bio ? (
            <p className="max-w-[42rem] text-sm text-gray-700 leading-6 text-center md:text-left">
              {athlete.bio}
            </p>
          ) : null}
        </div>
      </section>

      {/* Divider line under the profile section */}
      <div className={`${container} h-px bg-gray-300 flex-shrink-0`} />

      {/* Active campaigns section */}
      <section className={`${container} pt-12 pb-12 flex flex-col gap-6`}>
        <h2 className="text-2xl md:text-3xl font-semibold text-primary leading-9 text-center md:text-left">
          {t("{{name}}s aktiva insamlingar", { name: athlete.name, defaultValue: "{{name}}s aktiva insamlingar" })}
        </h2>

        {activeCampaigns.length > 0 ? (
          <div className="flex flex-col gap-6 w-full items-center md:items-start">
            {activeCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.campaignId ?? campaign.id}
                campaign={campaign}
                className="w-full max-w-[48rem]"
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[36rem] text-center md:text-left w-full mx-auto md:mx-0">
            <p className="text-sm text-gray-700 leading-6">
              {t("Den här atleten har inte lagt upp någon aktiv insamling ännu.")}
            </p>
          </div>
        )}
      </section>

      {/* Posts section */}
      <section className={`${container} pb-16 flex flex-col gap-6`}>
        <h2 className="text-2xl md:text-3xl font-semibold text-primary leading-9 text-center md:text-left">
          {t("{{name}}s inlägg", { name: athlete.name, defaultValue: "{{name}}s inlägg" })}
        </h2>

        {visiblePosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.postId ?? post.id}
                post={post}
                onOpen={() => setActivePost(post)}
                onToggleLike={handleToggleLike}
                isOwnPost={false}
                isAuthenticated={isAuthenticated}
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[36rem] text-center md:text-left w-full mx-auto md:mx-0">
            <p className="text-sm text-gray-700 leading-6">
              {t("Den här atleten har inte lagt upp några inlägg ännu.")}
            </p>
          </div>
        )}
      </section>

      <PostModal
        post={activePost}
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        onToggleLike={handleToggleLike}
        isOwnPost={false}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}