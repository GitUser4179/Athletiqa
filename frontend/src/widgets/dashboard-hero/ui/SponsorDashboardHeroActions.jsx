import { Button } from "../../../shared/ui/button";
import DashboardHeroActionCard from "./DashboardHeroActionCard";
import Message from "../../../shared/assets/message.svg?react";
import Help from "../../../shared/assets/sponsor.svg?react";
import Stat  from "../../../shared/assets/statistik.svg?react";
import Faq from "../../../shared/assets/faq.svg?react";
import { useMessageStore } from "../../../shared/model/useMessageStore";

export default function  SponsorDashboardHeroAction() {
  const openChat = useMessageStore((state) => state.openChat);
  return (
    <div className="mx-auto mt-10 flex w-full gap-6 max-w-[48rem] items-center  justify-center ">
      <DashboardHeroActionCard label="Meddelanden" onClick={openChat} icon={Message} />
      <DashboardHeroActionCard label="Hjälp fler" href="/explore" primary icon={Help} />
      <DashboardHeroActionCard label="FAQ" href="/faq" icon={Faq} />
    </div>
  );
}
