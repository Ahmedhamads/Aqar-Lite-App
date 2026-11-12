import { ContractDetails } from "@/features/contracts/contract-details";

interface ContractDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const { id } = await params;

  return <ContractDetails contractId={id} />;
}