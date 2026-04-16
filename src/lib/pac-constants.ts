// Known AIPAC-affiliated committee IDs from FEC public records.
// These are used to query PAC-to-candidate contributions.

/** AIPAC Political Action Committee (direct contributions to candidates) */
export const AIPAC_PAC_ID = "C00104299";

/** United Democracy Project — AIPAC-affiliated Super PAC (independent expenditures) */
export const AIPAC_SUPER_PAC_ID = "C00776997";

/** All AIPAC-affiliated committee IDs */
export const ALL_AIPAC_COMMITTEE_IDS = [
  AIPAC_PAC_ID,
  AIPAC_SUPER_PAC_ID,
] as const;
