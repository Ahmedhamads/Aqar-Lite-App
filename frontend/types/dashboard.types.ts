
export interface DashboardActivityActor {
  id: string;
  name: string;
  role: "MANAGER" | "ACCOUNTANT" | "SALES";
}

export interface DashboardActivity {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: DashboardActivityActor | null;
}

export interface DashboardSummary {
  units: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };

  clients: {
    total: number;
  };

  reservations: {
    total: number;
    active: number;
    expired: number;
    converted: number;
  };

  contracts: {
    total: number;
    draft: number;
    approved: number;
  };

  installments: {
    total: number;
    overdue: number;
  };

  financials: {
    installmentAmount: number;
    collectedAmount: number;
    remainingAmount: number;
  };

  recentActivity: DashboardActivity[];
}
