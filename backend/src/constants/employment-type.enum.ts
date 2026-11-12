/**
 * Employment Types
 * Used in HR module (Config.EmploymentType / hr.employees)
 * Derived from enterprise schema analysis:
 * - Permanent: Monthly salaried staff
 * - Contractual: Fixed-term contract employees
 * - CommissionBased: Delivery drivers and sales staff earning per delivered bottle
 * - DailyWages: Daily wage workers (washers, loaders, helpers)
 * - Temporary: Short-term seasonal workers
 * - Internee: Trainees
 * - ShortTerm: Project-based short-term workers
 */
export enum EmploymentTypeCode {
  PERMANENT = "Permanent",
  CONTRACTUAL = "Contractual",
  COMMISSION_BASED = "CommissionBased",
  DAILY_WAGES = "DailyWages",
  TEMPORARY = "Temporary",
  INTERNEE = "Internee",
  SHORT_TERM = "ShortTerm",
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentTypeCode, string> = {
  [EmploymentTypeCode.PERMANENT]: "Permanent",
  [EmploymentTypeCode.CONTRACTUAL]: "Contractual",
  [EmploymentTypeCode.COMMISSION_BASED]: "Commission Based",
  [EmploymentTypeCode.DAILY_WAGES]: "Daily Wages",
  [EmploymentTypeCode.TEMPORARY]: "Temporary",
  [EmploymentTypeCode.INTERNEE]: "Internee",
  [EmploymentTypeCode.SHORT_TERM]: "Short Term",
};
