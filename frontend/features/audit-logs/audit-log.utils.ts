type AuditTranslationKey =
  | "actionPaymentCreated"
  | "actionContractApproved"
  | "actionContractCreated"
  | "actionReservationConverted"
  | "actionReservationCreated"
  | "actionUserCreated"
  | "actionUserUpdated"
  | "actionUserActivated"
  | "actionUserDeactivated"
  | "actionLoginSuccess"
  | "actionLogout";

export function formatAuditAction(
  action: string,
  t: (key: AuditTranslationKey) => string,
): string {
  const translations: Record<string, AuditTranslationKey> = {
    PAYMENT_CREATED: "actionPaymentCreated",
    CONTRACT_APPROVED: "actionContractApproved",
    CONTRACT_CREATED: "actionContractCreated",
    RESERVATION_CONVERTED: "actionReservationConverted",
    RESERVATION_CREATED: "actionReservationCreated",
    USER_CREATED: "actionUserCreated",
    USER_UPDATED: "actionUserUpdated",
    USER_ACTIVATED: "actionUserActivated",
    USER_DEACTIVATED: "actionUserDeactivated",
    LOGIN_SUCCESS: "actionLoginSuccess",
    LOGOUT: "actionLogout",
  };

  const translationKey = translations[action];

  return translationKey
    ? t(translationKey)
    : action.replaceAll("_", " ");
}