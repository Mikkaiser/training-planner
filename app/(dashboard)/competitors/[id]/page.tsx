import { CompetitorProfileView } from "@/components/competitors/competitor-profile-view";

export default function CompetitorProfilePage({ params }: { params: { id: string } }) {
  return <CompetitorProfileView competitorId={params.id} />;
}
