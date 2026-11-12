import { InstallmentsList } from "@/features/installments/installments-list";

interface ContractInstallmentsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContractInstallmentsPage({
  params,
}: ContractInstallmentsPageProps) {
  const { id } = await params;

  return <InstallmentsList contractId={id} />;
}