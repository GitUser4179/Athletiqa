import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../../shared/ui/tabs';
import { CreatePostForm } from '../../../features/create-post';
import { CreateCampaignForm } from '../../../features/create-campaign';

export default function CreatePostPage() {
    // ?tab=campaign opens the campaign form directly (e.g. from "Skapa en ny insamling" on the profile)
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "campaign" ? "campaign" : "post");

  return (
    <main className="w-full flex flex-col items-center pt-10 pb-20 gap-10">
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { id: "post", label: "Skapa inlägg" },
          { id: "campaign", label: "Skapa insamling" },
        ]}
        className="w-[32rem]"
        itemClassName="flex-1 py-4 text-base"
      />

      <div className={activeTab === "post" ? "block w-full" : "hidden"}>
        <CreatePostForm />
      </div>

      <div className={activeTab === "campaign" ? "block w-full" : "hidden"}>
        <CreateCampaignForm />
      </div>
    </main>
  );

}