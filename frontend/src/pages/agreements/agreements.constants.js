/**
 * Enum for agreement types.
 * @enum {string}
 * @property {string} CONTRACT
 * @property {string} DIRECT_OBLIGATION
 * @property {string} GRANT
 * @property {string} AA
 * @property {string} IAA
 * @property {string} MISCELLANEOUS
 */
export const AgreementType = {
    CONTRACT: "CONTRACT",
    DIRECT_OBLIGATION: "DIRECT_OBLIGATION",
    GRANT: "GRANT",
    AA: "AA",
    IAA: "IAA",
    MISCELLANEOUS: "MISCELLANEOUS"
};

/**
 * Enum for procurementShop types.
 * @enum {string}
 * @property {string} PSC
 * @property {string} GCS
 * @property {string} NIH
 * @property {string} IBC
 */
export const ProcurementShopType = {
    PSC: "PSC",
    GCS: "GCS",
    NIH: "NIH",
    IBC: "IBC"
};

/**
 * Enum for agreement fields.
 * @enum {string}
 * @property {string} Description
 */

export const AgreementFields = {
    DescriptionAndNotes: "DescriptionAndNotes",
    PartnerType: "PartnerType",
    FundingMethod: "FundingMethod",
    RequestingAgency: "RequestingAgency",
    ServicingAgency: "ServicingAgency",
    ContractType: "ContractType",
    ContractNumber: "ContractNumber",
    ProductServiceCode: "ProductServiceCode",
    ServiceRequirementType: "ServiceRequirementType",
    NaicsCode: "NaicsCode",
    ProgramSupportCode: "ProgramSupportCode",
    ProcurementShop: "ProcurementShop",
    AgreementReason: "AgreementReason",
    Vendor: "Vendor",
    Methodologies: "Methodologies",
    SpecialTopic: "SpecialTopic",
    DivisionDirectors: "DivisionDirectors",
    TeamLeaders: "TeamLeaders",
    NickName: "NickName",
    Name: "Name",
    NofoNumber: "NofoNumber",
    AlnNumber: "AlnNumber",
    GrantFundingPeriod: "GrantFundingPeriod",
    NofoPeriod: "NofoPeriod",
    PeriodOfPerformance: "PeriodOfPerformance"
};

export const AGREEMENT_NICKNAME_LABEL = "Agreement Nickname or Acronym";

export const PERIOD_OF_PERFORMANCE_TOOLTIP =
    "Agreement Period of Performance (PoP) is calculated from the earliest PoP start date and the latest PoP end date from the agreement's services components";

/**
 * Mapping of award type codes to display labels.
 * @type {Record<string, string>}
 */
export const AWARD_TYPE_LABELS = {
    NEW: "New Award",
    CONTINUING: "Continuing Agreement"
};
