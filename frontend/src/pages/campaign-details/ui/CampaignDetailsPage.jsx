import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCampaignById, CampaignDetailProgress } from '../../../enteties/campaign';
import { DonationsList } from "../../../enteties/donation";
import { Avatar } from "../../../shared/ui/avatar";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../shared/assets";
import { FollowButton } from "../../../features/follow-athlete";
import { useAuth } from "../../../shared/lib/useAuth";
import { CampaignForm } from "../../../features/donate-to-campaign";
import { useTranslation } from "react-i18next";

export default function CampaignDetailsPage() {
    const { id } = useParams(); // This will get the :id part from the URL, so if we're at /campaign/1, id will be "1".
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [mediaIndex, setMediaIndex] = useState(0);
    const [campaign, setCampaign] = useState(null); // We'll store the campaign details here and start with null until we fetch it.
    const [isLoading, setIsLoading] = useState(true); // This will track whether we're still loading the campaign details.
    const [showDonateModal, setShowDonateModal] = useState(false);

    useEffect(() => 
    {
        getCampaignById(id)
            .then((data) => {
                setCampaign(data);
                setMediaIndex(0);
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading)
    {
        return <div>{t("Loading...")}</div>;
    }

    if (!campaign)
    {
        return <div>{t("Campaign not found.")}</div>;
    }

    const formattedDate = campaign.createdAt
        ? new Date(campaign.createdAt).toLocaleDateString("sv-SE")
        : "Recently created"; // Format date as YYYY-MM-DD or show "Recently created" if no date is available

    const media = campaign.mediaUrls?.length ? campaign.mediaUrls : [campaign.mediaUrl];
    const currentMedia = media[Math.min(mediaIndex, media.length - 1)];
    const showPrevious = () => setMediaIndex((i) => (i - 1 + media.length) % media.length);
    const showNext = () => setMediaIndex((i) => (i + 1) % media.length);

        return (
        <>
            <main className="w-full flex flex-col items-center gap-8 p-8 text-gray-700 ">
              <article className="w-[80%] flex flex-row flex-wrap gap-8 justify-between ">
                    {/*Left Column: Story */}
                    <article className="w-[60%] rounded-xl">
                        <figure className="campaign-detail__image-wrapper">
                            <img className="border border-gray-300 rounded-xl w-full aspect-[16/9] object-cover" src={currentMedia} alt={campaign.title} />
                        </figure>
                        <section className="flex flex-col gap-4 p-2">
                            <header className="flex flex-row justify-between">
                                <h1 className="font-bold text-2xl">{campaign.title}</h1>
                                <time className="campaign-detail__date">{formattedDate}</time>
                            </header>
                            {/* Author row: avatar + name (links to the athlete's profile) + follow */}
                            <section className="flex items-center gap-3 border-b border-gray-300 pb-3">
                                <Link
                                    to={`/athlete-profile/${campaign.athleteId}`}
                                    className="flex items-center gap-3 no-underline hover:underline text-gray-700"
                                >
                                    <Avatar
                                        src={campaign.athletePhotoUrl}
                                        alt={campaign.athleteName}
                                        size="sm"
                                        fallback={campaign.athleteGender}
                                    />
                                    <span className="font-semibold text-primary">{campaign.athleteName}</span>
                                </Link>
                                {!campaign.isOwnCampaign && (
                                    <FollowButton
                                        athleteId={campaign.athleteId}
                                        initialIsFollowing={campaign.isFollowing}
                                        isAuthenticated={isAuthenticated}
                                    />
                                )}
                            </section>
                            {/*Posts doesnt have sport*/}
                            {/* <section className="border-b border-gray-500 pb-2">
                                <label className="font-semibold">Sport: </label>
                                <span className="sport-tag">{campaign.sport}</span>
                            </section> */}
                            <section className=" pb-2">
                                <p>{campaign.content}</p>
                            </section>
                        </section>
                    </article>
                    {/*Right Column: Donation Progress*/}
                    <article className="w-[35%] self-start bg-bg p-4 rounded-xl flex flex-col border border-gray-300 shadow-md">
                        <section className="flex flex-col gap-2 mb-4 mt-4">
                                <CampaignDetailProgress
                                    current={campaign.currentAmount}
                                    goal={campaign.goalAmount}
                                    showSekFormat={true}
                                />
                                <div className="w-full bg-accent-light rounded-full h-4">
                                    <div className="bg-accent h-4 rounded-full" style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}></div>
                                </div>
                                <p className="mt-4 mb-8">
																	{t("*Det är viktigt för oss att du känner dig trygg när du donerar. Betalningen sker via säkra, certifierade system och dina uppgifter skyddas alltid. Läs mer om hur vi hanterar din donation här.")}
																</p>
                        </section>
                        <section className="w-full flex flex-col items-center gap-4" aria-label="Campaign Actions">
                            <button
                                    className={`w-full p-[0.5rem] text-white rounded-xl transition duration-300 ${
                                        campaign.currentAmount >= campaign.goalAmount? 'bg-gray-500 cursor-not-allowed': 'bg-primary hover:bg-accent hover:text-primary cursor-pointer'}`}
                                        disabled={campaign.currentAmount >= campaign.goalAmount}
                                        onClick={() => {
                                            sessionStorage.setItem("athleteName", campaign.athleteName);
                                            sessionStorage.setItem("campaignId", id);
                                            setShowDonateModal(true);
                                        }}
                                    >
                                      {t(campaign.currentAmount >= campaign.goalAmount ? "Fullt finansierad" : "Donera")}
                                </button>
                            <button className="border border-primary w-full p-[0.5rem] text-primary bg-bg rounded-xl hover:bg-primary-light transition duration-300 cursor-pointer">{t("Dela")}</button>
                        </section>
                        <section className="mt-6 flex flex-col gap-3 max-h-[16rem] overflow-y-auto">
                            <h3 className="font-semibold">{t("Senaste donationerna:")}</h3>
                            <DonationsList campaignId={id}/>
                        </section>
                    </article>
              </article>
            {/* Media gallery: thumbnails + arrows switch the main image. Hidden when there's only one image. */}
              {media.length > 1 && (
                <article className="w-[80%] flex flex-col gap-4">
                    <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 border border-gray-300 bg-bg rounded-xl p-4">
                        {media.map((url, index) => (
                            <button
                                key={`${url}-${index}`}
                                type="button"
                                onClick={() => setMediaIndex(index)}
                                className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${
                                    index === mediaIndex ? "border-primary" : "border-transparent hover:border-primary-light"
                                }`}
                                aria-label={`${t("Visa bild")} ${index + 1}`}
                            >
                                <img className="w-full aspect-[4/3] object-cover" src={url} alt="" />
                            </button>
                        ))}
                    </section>
                    <section className="flex flex-row gap-3">
                        <button
                            type="button"
                            onClick={showPrevious}
                            className="w-10 h-10 rounded-full border-2 border-primary text-primary bg-transparent hover:bg-primary-light flex items-center justify-center cursor-pointer"
                            aria-label={t("Föregående bild")}
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={showNext}
                            className="w-10 h-10 rounded-full border-2 border-primary text-primary bg-transparent hover:bg-primary-light flex items-center justify-center cursor-pointer"
                            aria-label={t("Nästa bild")}
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </section>
                </article>
              )}
            </main>

            {
                showDonateModal && (
                    <div

                        className="fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50"

                        onClick={() => setShowDonateModal(false)}>

                        <div className="relative" onClick={(e) => e.stopPropagation()}>

                            {/* Close Button */}
                            <button
                                className="absolute top-8 right-8 text-2xl font-bold text-gray-500 hover:text-primary cursor-pointer z-50"

                                onClick={() => setShowDonateModal(false)}>✕</button>

                            <CampaignForm campaignId={id} />
                        </div>
                    </div>
                )
            }
        </>
    );
} 