import { useEffect, useState } from "react";
import { getMyFollowStats } from "../../../features/follow-athlete";
import { Link, Navigate, useParams } from "react-router-dom";
import LoggedInAthleteProfile from "./LoggedInAthleteProfile";
import PublicAthleteProfile from "./PublicAthleteProfile";
import { useCurrentUser } from "../../../shared/lib/useCurrentUser";
import {
  getPublicAthleteCampaigns,
  getPublicAthletePosts,
  getPublicAthleteProfile,
} from "../../../shared/api";
import { listMyPosts, mapPostFromApi } from "../../../enteties/post";
import { listMyCampaigns, mapCampaignFromApi } from "../../../enteties/campaign";
import {
  getAthleteProfile,
  getAthleteSports,
} from "../../../features/update-settings";

// Page width used across the whole screen.
export const container = "w-full max-w-[109rem] mx-auto px-5 md:px-[3.25rem]";

export default function AthleteProfilePage() {
  const { id } = useParams();
  const { currentUser, isLoading } = useCurrentUser();
  const [publicAthlete, setPublicAthlete] = useState(null);
  const [publicPosts, setPublicPosts] = useState([]);
  const [publicCampaigns, setPublicCampaigns] = useState([]);
  const [isPublicProfileLoading, setIsPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState(null);

  const [athlete, setAthlete] = useState(null);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [finishedCampaigns, setFinishedCampaigns] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (id || isLoading) return;

    if (!currentUser) {
      setProfileLoading(false);
      return;
    }

    let ignore = false;

    async function loadLoggedInAthleteProfile() {
      setProfileLoading(true);
      setProfileError(null);

      try {
        const [profileData, sportsData, postsData, campaignsData, followStats] = await Promise.all([
          getAthleteProfile(),
          getAthleteSports(),
          listMyPosts(),
          listMyCampaigns(),
          getMyFollowStats().catch(() => ({ followers: 0, following: 0 })),
        ]);

        const athleteName =
          `${profileData.firstName ?? ""} ${profileData.lastName ?? ""}`.trim();

        if (!ignore) {
          setAthlete({
            userId: currentUser.userId,
            athleteId: currentUser.userId,
            name: athleteName || "Okänd atlet",
            photoUrl: profileData.photoUrl ?? "",
            gender: profileData.gender,
            bio: profileData.bio ?? "",
            sports: sportsData?.sports ?? sportsData ?? [],
            followers: followStats.followers ?? 0,
            following: followStats.following ?? 0,
          });

          setVisiblePosts(postsData);

          setActiveCampaigns(
            campaignsData.filter(
              (campaign) => campaign.currentAmount < campaign.goalAmount,
            ),
          );

          setFinishedCampaigns(
            campaignsData.filter(
              (campaign) => campaign.currentAmount >= campaign.goalAmount,
            ),
          );
        }
      } catch (error) {
        if (!ignore) {
          setProfileError(error);
        }
      } finally {
        if (!ignore) {
          setProfileLoading(false);
        }
      }
    }

    loadLoggedInAthleteProfile();

    return () => {
      ignore = true;
    };
  }, [currentUser, id, isLoading]);

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    async function loadPublicAthleteProfile() {
      setIsPublicProfileLoading(true);
      setPublicProfileError(null);

      try {
        const [profile, posts, campaigns] = await Promise.all([
          getPublicAthleteProfile(id),
          getPublicAthletePosts(id),
          getPublicAthleteCampaigns(id),
        ]);

        if (!ignore) {
          setPublicAthlete(profile);
          setPublicPosts(posts.map(mapPostFromApi));
          setPublicCampaigns(campaigns.map(mapCampaignFromApi));
        }
      } catch (error) {
        if (!ignore) {
          setPublicProfileError(error);
        }
      } finally {
        if (!ignore) {
          setIsPublicProfileLoading(false);
        }
      }
    }

    loadPublicAthleteProfile();

    return () => {
      ignore = true;
    };
  }, [id]);

  const publicProfileAthlete = publicAthlete
    ? {
        ...publicAthlete,
        sports: publicAthlete.sports ?? [],
      }
    : athlete;
  const isOwnProfile = Boolean(currentUser) && !id;
  const isAuthenticated = Boolean(currentUser);

  if (
    isLoading ||
    profileLoading ||
    isPublicProfileLoading ||
    (id && !publicAthlete && !publicProfileError)
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <main className={`${container} flex-1 pt-8`}>Laddar profil...</main>
      </div>
    );
  }

  if (!id && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!id && profileError) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <main className={`${container} flex-1 pt-8`}>
          Kunde inte ladda profilen.
        </main>
      </div>
    );
  }

  if (!id && !athlete) {
    return null;
  }

  if (id && !publicProfileAthlete) {
    return null;
  }

  if (id && publicProfileError) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <main className={`${container} flex-1 pt-8`}>
          Kunde inte ladda profilen.
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <main className="flex-1 flex flex-col">
        {/* breadcrumb */}
        <nav
          className={`${container} pt-8 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-700`}
        >
          <Link to="/" className="hover:underline">
            Start
          </Link>
          <span>/</span>
          <Link to="/explore" className="hover:underline">
            Utforska
          </Link>
          <span>/</span>
          <span className="truncate max-w-[12rem] sm:max-w-none">
            {isOwnProfile ? athlete.name : publicProfileAthlete.name}
          </span>
        </nav>

        {isOwnProfile ? (
          <LoggedInAthleteProfile
            container={container}
            athlete={athlete}
            activeCampaigns={activeCampaigns}
            finishedCampaigns={finishedCampaigns}
            visiblePosts={visiblePosts}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <PublicAthleteProfile
            container={container}
            athlete={publicProfileAthlete}
            activeCampaigns={publicCampaigns}
            visiblePosts={publicPosts}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
    </div>
  );
}