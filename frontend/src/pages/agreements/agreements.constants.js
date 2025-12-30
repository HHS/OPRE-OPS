/**
 * Enum for agreement types.
 * @enum {string}
 * @property {string} CONTRACT
 * @property {string} GRANT
 * @property {string} DIRECT_OBLIGATION
 * @property {string} IAA
 * @property {string} AA
 * @property {string} MISCELLANEOUS
 */
export const AgreementType = {
    CONTRACT: "CONTRACT",
    GRANT: "GRANT",
    DIRECT_OBLIGATION: "DIRECT_OBLIGATION",
    IAA: "IAA",
    AA: "AA",
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
    Name: "Name"
};

export const AGREEMENT_NICKNAME_LABEL = "Agreement Nickname or Acronym";
