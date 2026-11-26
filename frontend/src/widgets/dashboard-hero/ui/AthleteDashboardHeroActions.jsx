import { useMessageStore } from "../../../shared/model/useMessageStore";
import DashboardHeroActionCard from "./DashboardHeroActionCard";
// import  DashboardHeroActionCard  from "./DashboardHeroActionCard";
import Message from "../../../shared/assets/message.svg?react";
import PlusIcon from "../../../shared/assets/plus.svg?react";
import Faq from "../../../shared/assets/faq.svg?react";

import Stat  from "../../../shared/assets/statistik.svg?react";
export default function AthleteDashboardHeroActions() {
  const openChat = useMessageStore((state) => state.openChat);
  return (
    <div className="mx-auto flex gap-6 relative z-10">
      <DashboardHeroActionCard
        label="Meddelanden"
        onClick={openChat}
        icon={Message}
      />
      <DashboardHeroActionCard
        label="Skapa"
        href="/create-post"
        primary
        icon={PlusIcon}
      />
      <DashboardHeroActionCard label="FAQ" href="/faq" icon={Faq} />
      {/* <DashboardHeroActionCard label="Meddelanden" href="/messages" icon={Message} />
      <DashboardHeroActionCard label="Skapa" href="/explore" primary  icon={PlusIcon} />
      <DashboardHeroActionCard label="Min statistik" href="/statistics" icon={Stat} /> */}
    </div>
  );
  
}
