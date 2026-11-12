import { ReservationDetails } from "@/features/reservations/reservation-details";

interface ReservationDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReservationDetailsPage({
  params,
}: ReservationDetailsPageProps) {
  const { id } = await params;

  return <ReservationDetails reservationId={id} />;
}