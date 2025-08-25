classDiagram
direction BT
class aa_agreement {
   integer requesting_agency_id
   integer servicing_agency_id
   servicerequirementtype service_requirement_type
   varchar contract_number
   integer vendor_id
   varchar task_order_number
   varchar po_number
   acquisitiontype acquisition_type
   boolean delivered_status
   contracttype contract_type
   contractcategory contract_category
   varchar psc_contract_specialist
   integer cotr_id
   integer id
}
class aa_agreement_version {
   integer requesting_agency_id
   integer servicing_agency_id
   servicerequirementtype service_requirement_type
   varchar contract_number
   integer vendor_id
   varchar task_order_number
   varchar po_number
   acquisitiontype acquisition_type
   boolean delivered_status
   contracttype contract_type
   contractcategory contract_category
   varchar psc_contract_specialist
   integer cotr_id
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class aa_budget_line_item {
   integer mod_id
   varchar psc_fee_doc_number
   varchar psc_fee_pymt_ref_nbr
   integer id
}
class aa_budget_line_item_version {
   bigint end_transaction_id
   smallint operation_type
   integer mod_id
   varchar psc_fee_doc_number
   varchar psc_fee_pymt_ref_nbr
   integer id
   bigint transaction_id
}
class aa_support_contacts {
   integer aa_id
   integer users_id
}
class aa_support_contacts_version {
   bigint end_transaction_id
   smallint operation_type
   integer aa_id
   integer users_id
   bigint transaction_id
}
class administrative_and_support_project {
   integer id
}
class administrative_and_support_project_version {
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class agreement {
   agreementtype agreement_type
   varchar name
   varchar description
   integer product_service_code_id
   agreementreason agreement_reason
   integer project_officer_id
   integer project_id
   integer awarding_entity_id
   text notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   date start_date
   date end_date
   integer maps_sys_id
   integer alternate_project_officer_id
   varchar nick_name
   integer id
}
class agreement_agency {
   varchar name
   varchar abbreviation
   boolean requesting
   boolean servicing
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class agreement_agency_version {
   varchar name
   varchar abbreviation
   boolean requesting
   boolean servicing
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class agreement_mod {
   integer agreement_id
   modtype mod_type
   varchar number
   date mod_date
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class agreement_mod_version {
   integer agreement_id
   modtype mod_type
   varchar number
   date mod_date
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class agreement_ops_db_history {
   integer agreement_id
   integer ops_db_history_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class agreement_ops_db_history_version {
   integer agreement_id
   integer ops_db_history_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class agreement_team_members {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer user_id
   integer agreement_id
}
class agreement_team_members_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer user_id
   integer agreement_id
   bigint transaction_id
}
class agreement_version {
   agreementtype agreement_type
   varchar name
   varchar description
   integer product_service_code_id
   agreementreason agreement_reason
   integer project_officer_id
   integer project_id
   integer awarding_entity_id
   text notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   date start_date
   date end_date
   integer maps_sys_id
   integer alternate_project_officer_id
   varchar nick_name
   integer id
   bigint transaction_id
}
class alembic_version {
   varchar(32) version_num
}
class budget_line_item {
   varchar line_description
   text comments
   integer agreement_id
   integer can_id
   numeric(12,2) amount
   budgetlineitemstatus status
   boolean on_hold
   boolean certified
   boolean closed
   boolean is_under_current_resolution
   date date_needed
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer closed_by
   date closed_date
   date extend_pop_to
   date start_date
   date end_date
   integer object_class_code_id
   boolean doc_received
   date obligation_date
   agreementtype budget_line_item_type
   numeric(12,5) proc_shop_fee_percentage
   integer procurement_shop_fee_id
   varchar service_component_name_for_sort
   boolean is_obe
   integer id
}
class budget_line_item_version {
   varchar line_description
   text comments
   integer agreement_id
   integer can_id
   numeric(12,2) amount
   budgetlineitemstatus status
   boolean on_hold
   boolean certified
   boolean closed
   boolean is_under_current_resolution
   date date_needed
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer closed_by
   date closed_date
   date extend_pop_to
   date start_date
   date end_date
   integer object_class_code_id
   boolean doc_received
   date obligation_date
   agreementtype budget_line_item_type
   numeric(12,5) proc_shop_fee_percentage
   integer procurement_shop_fee_id
   varchar service_component_name_for_sort
   boolean is_obe
   integer id
   bigint transaction_id
}
class can {
   varchar(30) number
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   varchar nick_name
   integer funding_details_id
   integer portfolio_id
   integer id
}
class can_funding_budget {
   integer fiscal_year
   numeric budget
   varchar notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer can_id
   integer id
}
class can_funding_budget_version {
   integer fiscal_year
   numeric budget
   varchar notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer can_id
   integer id
   bigint transaction_id
}
class can_funding_details {
   integer fiscal_year
   varchar fund_code
   varchar allowance
   varchar sub_allowance
   varchar allotment
   varchar appropriation
   canmethodoftransfer method_of_transfer
   canfundingsource funding_source
   varchar funding_partner
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class can_funding_details_version {
   integer fiscal_year
   varchar fund_code
   varchar allowance
   varchar sub_allowance
   varchar allotment
   varchar appropriation
   canmethodoftransfer method_of_transfer
   canfundingsource funding_source
   varchar funding_partner
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class can_funding_received {
   integer fiscal_year
   numeric funding
   varchar notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer can_id
   integer id
}
class can_funding_received_version {
   integer fiscal_year
   numeric funding
   varchar notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer can_id
   integer id
   bigint transaction_id
}
class can_history {
   integer can_id
   integer ops_event_id
   varchar history_title
   text history_message
   varchar timestamp
   canhistorytype history_type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer fiscal_year
   integer id
}
class can_history_version {
   integer can_id
   integer ops_event_id
   varchar history_title
   text history_message
   varchar timestamp
   canhistorytype history_type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer fiscal_year
   integer id
   bigint transaction_id
}
class can_version {
   varchar(30) number
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   varchar nick_name
   integer funding_details_id
   integer portfolio_id
   integer id
   bigint transaction_id
}
class change_request {
   changerequesttype change_request_type
   changerequeststatus status
   jsonb requested_change_data
   jsonb requested_change_diff
   jsonb requested_change_info
   varchar requestor_notes
   integer managing_division_id
   integer reviewed_by_id
   timestamp reviewed_on
   varchar reviewer_notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer agreement_id
   integer budget_line_item_id
   integer id
}
class change_request_version {
   changerequesttype change_request_type
   changerequeststatus status
   jsonb requested_change_data
   jsonb requested_change_diff
   jsonb requested_change_info
   varchar requestor_notes
   integer managing_division_id
   integer reviewed_by_id
   timestamp reviewed_on
   varchar reviewer_notes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer agreement_id
   integer budget_line_item_id
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class clin {
   integer number
   varchar name
   date pop_start_date
   date pop_end_date
   integer contract_agreement_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class clin_version {
   integer number
   varchar name
   date pop_start_date
   date pop_end_date
   integer contract_agreement_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class contact {
   varchar first_name
   varchar last_name
   varchar middle_name
   varchar address
   varchar city
   varchar state
   varchar zip
   varchar phone_area_code
   varchar phone_number
   varchar email
   contacttype contact_type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class contact_version {
   varchar first_name
   varchar last_name
   varchar middle_name
   varchar address
   varchar city
   varchar state
   varchar zip
   varchar phone_area_code
   varchar phone_number
   varchar email
   contacttype contact_type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class contract_agreement {
   varchar contract_number
   integer vendor_id
   varchar task_order_number
   varchar po_number
   acquisitiontype acquisition_type
   boolean delivered_status
   contracttype contract_type
   servicerequirementtype service_requirement_type
   contractcategory contract_category
   varchar psc_contract_specialist
   integer cotr_id
   integer id
}
class contract_agreement_version {
   varchar contract_number
   integer vendor_id
   varchar task_order_number
   varchar po_number
   acquisitiontype acquisition_type
   boolean delivered_status
   contracttype contract_type
   servicerequirementtype service_requirement_type
   contractcategory contract_category
   bigint end_transaction_id
   smallint operation_type
   varchar psc_contract_specialist
   integer cotr_id
   integer id
   bigint transaction_id
}
class contract_budget_line_item {
   integer services_component_id
   integer clin_id
   integer mod_id
   varchar psc_fee_doc_number
   varchar psc_fee_pymt_ref_nbr
   integer id
}
class contract_budget_line_item_version {
   integer services_component_id
   integer clin_id
   integer mod_id
   varchar psc_fee_doc_number
   varchar psc_fee_pymt_ref_nbr
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class contract_support_contacts {
   integer contract_id
   integer users_id
}
class contract_support_contacts_version {
   bigint end_transaction_id
   smallint operation_type
   integer contract_id
   integer users_id
   bigint transaction_id
}
class direct_agreement {
   integer id
}
class direct_agreement_version {
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class direct_obligation_budget_line_item {
   varchar receiving_agency
   varchar ip_nbr
   integer id
}
class direct_obligation_budget_line_item_version {
   bigint end_transaction_id
   smallint operation_type
   varchar receiving_agency
   varchar ip_nbr
   integer id
   bigint transaction_id
}
class division {
   varchar(100) name
   varchar(10) abbreviation
   integer division_director_id
   integer deputy_division_director_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class division_version {
   varchar(100) name
   varchar(10) abbreviation
   integer division_director_id
   integer deputy_division_director_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class document {
   integer agreement_id
   varchar document_id
   documenttype document_type
   varchar document_name
   varchar status
   numeric(10,2) document_size
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class document_version {
   integer agreement_id
   varchar document_id
   documenttype document_type
   varchar document_name
   varchar status
   numeric(10,2) document_size
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class grant_agreement {
   varchar foa
   numeric(12,2) total_funding
   integer number_of_years
   integer number_of_grants
   integer id
}
class grant_agreement_version {
   varchar foa
   bigint end_transaction_id
   smallint operation_type
   numeric(12,2) total_funding
   integer number_of_years
   integer number_of_grants
   integer id
   bigint transaction_id
}
class grant_budget_line_item {
   integer grant_year_number
   varchar bns_number
   date committed_date
   date fa_signed_date
   integer details_id
   integer id
}
class grant_budget_line_item_detail {
   varchar grants_number
   varchar grantee_name
   boolean educational_institution
   statecode state_code
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class grant_budget_line_item_detail_version {
   varchar grants_number
   varchar grantee_name
   boolean educational_institution
   statecode state_code
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class grant_budget_line_item_version {
   integer grant_year_number
   varchar bns_number
   date committed_date
   date fa_signed_date
   bigint end_transaction_id
   smallint operation_type
   integer details_id
   integer id
   bigint transaction_id
}
class group {
   varchar name
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class group_version {
   varchar name
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class iaa_agreement {
   iaadirectiontype direction
   integer iaa_customer_agency_id
   varchar opre_poc
   varchar agency_poc
   integer id
}
class iaa_agreement_version {
   bigint end_transaction_id
   smallint operation_type
   iaadirectiontype direction
   integer iaa_customer_agency_id
   varchar opre_poc
   varchar agency_poc
   integer id
   bigint transaction_id
}
class iaa_budget_line_item {
   varchar ip_nbr
   integer id
}
class iaa_budget_line_item_version {
   varchar ip_nbr
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class iaa_customer_agency {
   varchar name
   varchar customer_duns
   integer object_class_code_id
   varchar customer_agency_nbr
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class iaa_customer_agency_contacts {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer iaa_customer_agency_id
   integer contact_id
}
class iaa_customer_agency_contacts_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer iaa_customer_agency_id
   integer contact_id
   bigint transaction_id
}
class iaa_customer_agency_version {
   varchar name
   varchar customer_duns
   integer object_class_code_id
   varchar customer_agency_nbr
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class invoice {
   integer budget_line_item_id
   integer invoice_line_number
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class invoice_version {
   integer budget_line_item_id
   integer invoice_line_number
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class notification {
   notificationtype notification_type
   varchar title
   varchar message
   boolean is_read
   date expires
   integer recipient_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer change_request_id
   integer id
}
class notification_version {
   notificationtype notification_type
   varchar title
   varchar message
   boolean is_read
   date expires
   integer recipient_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer change_request_id
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class object_class_code {
   integer code
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class object_class_code_version {
   integer code
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class ops_db_history {
   opsdbhistorytype event_type
   jsonb event_details
   varchar class_name
   varchar row_key
   jsonb changes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class ops_db_history_version {
   opsdbhistorytype event_type
   jsonb event_details
   varchar class_name
   varchar row_key
   jsonb changes
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class ops_event {
   opseventtype event_type
   opseventstatus event_status
   jsonb event_details
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class ops_event_version {
   opseventtype event_type
   opseventstatus event_status
   jsonb event_details
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class ops_user {
   uuid oidc_id
   varchar hhs_id
   varchar email
   varchar first_name
   varchar last_name
   integer division
   userstatus status
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class ops_user_version {
   uuid oidc_id
   varchar hhs_id
   varchar email
   varchar first_name
   varchar last_name
   integer division
   userstatus status
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class portfolio {
   varchar name
   varchar abbreviation
   portfoliostatus status
   integer division_id
   text description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class portfolio_team_leaders {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer portfolio_id
   integer team_lead_id
}
class portfolio_team_leaders_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer portfolio_id
   integer team_lead_id
   bigint transaction_id
}
class portfolio_url {
   integer portfolio_id
   varchar url
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class portfolio_url_version {
   integer portfolio_id
   varchar url
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class portfolio_version {
   varchar name
   varchar abbreviation
   portfoliostatus status
   integer division_id
   text description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_acquisition_planning {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   integer id
}
class procurement_acquisition_planning_version {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_award {
   varchar vendor
   varchar vendor_type
   varchar financial_number
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   integer id
}
class procurement_award_version {
   varchar vendor
   varchar vendor_type
   varchar financial_number
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_evaluation {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   integer id
}
class procurement_evaluation_version {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_pre_solicitation {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   integer id
}
class procurement_pre_solicitation_version {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_preaward {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   integer id
}
class procurement_preaward_version {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_shop {
   varchar name
   varchar abbr
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class procurement_shop_fee {
   integer procurement_shop_id
   numeric(12,2) fee
   date start_date
   date end_date
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class procurement_shop_fee_version {
   integer procurement_shop_id
   numeric(12,2) fee
   date start_date
   date end_date
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_shop_version {
   varchar name
   varchar abbr
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_solicitation {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   integer id
}
class procurement_solicitation_version {
   boolean is_complete
   date actual_date
   integer completed_by
   varchar notes
   date target_date
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_step {
   integer agreement_id
   integer procurement_tracker_id
   varchar type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class procurement_step_version {
   integer agreement_id
   integer procurement_tracker_id
   varchar type
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class procurement_tracker {
   integer agreement_id
   integer current_step_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class procurement_tracker_version {
   integer agreement_id
   integer current_step_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class product_service_code {
   varchar name
   integer naics
   varchar support_code
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class product_service_code_version {
   varchar name
   integer naics
   varchar support_code
   varchar description
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class project {
   projecttype project_type
   varchar title
   varchar short_title
   text description
   text url
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class project_team_leaders {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer project_id
   integer team_lead_id
}
class project_team_leaders_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer project_id
   integer team_lead_id
   bigint transaction_id
}
class project_version {
   projecttype project_type
   varchar title
   varchar short_title
   text description
   text url
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class requisition {
   integer budget_line_item_id
   varchar zero_number
   date zero_date
   varchar number
   date date
   integer group
   varchar check
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class requisition_version {
   integer budget_line_item_id
   varchar zero_number
   date zero_date
   varchar number
   date date
   integer group
   varchar check
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class research_project {
   date origination_date
   methodologytype[] methodologies
   populationtype[] populations
   integer id
}
class research_project_version {
   date origination_date
   methodologytype[] methodologies
   populationtype[] populations
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class role {
   varchar name
   character varying[] permissions
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class role_version {
   varchar name
   character varying[] permissions
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class services_component {
   integer number
   boolean optional
   varchar description
   date period_start
   date period_end
   varchar sub_component
   integer contract_agreement_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   varchar display_name_for_sort
   integer id
}
class services_component_version {
   integer number
   boolean optional
   varchar description
   date period_start
   date period_end
   varchar sub_component
   integer contract_agreement_id
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   varchar display_name_for_sort
   integer id
   bigint transaction_id
}
class shared_portfolio_cans {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer portfolio_id
   integer can_id
}
class shared_portfolio_cans_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer portfolio_id
   integer can_id
   bigint transaction_id
}
class transaction {
   varchar(50) remote_addr
   timestamp issued_at
   bigint id
}
class user_group {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer user_id
   integer group_id
}
class user_group_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer user_id
   integer group_id
   bigint transaction_id
}
class user_role {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer user_id
   integer role_id
}
class user_role_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer user_id
   integer role_id
   bigint transaction_id
}
class user_session {
   integer user_id
   boolean is_active
   varchar ip_address
   text access_token
   text refresh_token
   timestamp last_active_at
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class user_session_version {
   integer user_id
   boolean is_active
   varchar ip_address
   text access_token
   text refresh_token
   timestamp last_active_at
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}
class vendor {
   varchar name
   varchar duns
   boolean active
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer id
}
class vendor_contacts {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   integer vendor_id
   integer contact_id
}
class vendor_contacts_version {
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer vendor_id
   integer contact_id
   bigint transaction_id
}
class vendor_version {
   varchar name
   varchar duns
   boolean active
   integer created_by
   integer updated_by
   timestamp created_on
   timestamp updated_on
   bigint end_transaction_id
   smallint operation_type
   integer id
   bigint transaction_id
}

aa_agreement  -->  agreement : id
aa_agreement  -->  agreement_agency : requesting_agency_id:id
aa_agreement  -->  agreement_agency : servicing_agency_id:id
aa_agreement  -->  ops_user : cotr_id:id
aa_agreement  -->  vendor : vendor_id:id
aa_agreement_version  -->  transaction : transaction_id:id
aa_agreement_version  -->  vendor : vendor_id:id
aa_budget_line_item  -->  agreement_mod : mod_id:id
aa_budget_line_item  -->  budget_line_item : id
aa_budget_line_item_version  -->  transaction : transaction_id:id
aa_support_contacts  -->  aa_agreement : aa_id:id
aa_support_contacts  -->  ops_user : users_id:id
aa_support_contacts_version  -->  transaction : transaction_id:id
administrative_and_support_project  -->  project : id
administrative_and_support_project_version  -->  transaction : transaction_id:id
agreement  -->  ops_user : alternate_project_officer_id:id
agreement  -->  ops_user : created_by:id
agreement  -->  ops_user : project_officer_id:id
agreement  -->  ops_user : updated_by:id
agreement  -->  procurement_shop : awarding_entity_id:id
agreement  -->  product_service_code : product_service_code_id:id
agreement  -->  project : project_id:id
agreement_agency  -->  ops_user : updated_by:id
agreement_agency  -->  ops_user : created_by:id
agreement_agency_version  -->  transaction : transaction_id:id
agreement_mod  -->  agreement : agreement_id:id
agreement_mod  -->  ops_user : created_by:id
agreement_mod  -->  ops_user : updated_by:id
agreement_mod_version  -->  agreement : agreement_id:id
agreement_mod_version  -->  transaction : transaction_id:id
agreement_ops_db_history  -->  agreement : agreement_id:id
agreement_ops_db_history  -->  ops_db_history : ops_db_history_id:id
agreement_ops_db_history  -->  ops_user : updated_by:id
agreement_ops_db_history  -->  ops_user : created_by:id
agreement_ops_db_history_version  -->  agreement : agreement_id:id
agreement_ops_db_history_version  -->  ops_db_history : ops_db_history_id:id
agreement_ops_db_history_version  -->  transaction : transaction_id:id
agreement_team_members  -->  agreement : agreement_id:id
agreement_team_members  -->  ops_user : user_id:id
agreement_team_members  -->  ops_user : created_by:id
agreement_team_members  -->  ops_user : updated_by:id
agreement_team_members_version  -->  agreement : agreement_id:id
agreement_team_members_version  -->  transaction : transaction_id:id
agreement_version  -->  product_service_code : product_service_code_id:id
agreement_version  -->  project : project_id:id
agreement_version  -->  transaction : transaction_id:id
budget_line_item  -->  agreement : agreement_id:id
budget_line_item  -->  can : can_id:id
budget_line_item  -->  object_class_code : object_class_code_id:id
budget_line_item  -->  ops_user : updated_by:id
budget_line_item  -->  ops_user : closed_by:id
budget_line_item  -->  ops_user : created_by:id
budget_line_item  -->  procurement_shop_fee : procurement_shop_fee_id:id
budget_line_item_version  -->  agreement : agreement_id:id
budget_line_item_version  -->  can : can_id:id
budget_line_item_version  -->  object_class_code : object_class_code_id:id
budget_line_item_version  -->  procurement_shop_fee : procurement_shop_fee_id:id
budget_line_item_version  -->  transaction : transaction_id:id
can  -->  can_funding_details : funding_details_id:id
can  -->  ops_user : updated_by:id
can  -->  ops_user : created_by:id
can  -->  portfolio : portfolio_id:id
can_funding_budget  -->  can : can_id:id
can_funding_budget  -->  ops_user : created_by:id
can_funding_budget  -->  ops_user : updated_by:id
can_funding_budget_version  -->  can : can_id:id
can_funding_budget_version  -->  transaction : transaction_id:id
can_funding_details  -->  ops_user : updated_by:id
can_funding_details  -->  ops_user : created_by:id
can_funding_details_version  -->  transaction : transaction_id:id
can_funding_received  -->  can : can_id:id
can_funding_received  -->  ops_user : created_by:id
can_funding_received  -->  ops_user : updated_by:id
can_funding_received_version  -->  can : can_id:id
can_funding_received_version  -->  transaction : transaction_id:id
can_history  -->  can : can_id:id
can_history  -->  ops_event : ops_event_id:id
can_history  -->  ops_user : created_by:id
can_history  -->  ops_user : updated_by:id
can_history_version  -->  can : can_id:id
can_history_version  -->  ops_event : ops_event_id:id
can_history_version  -->  transaction : transaction_id:id
can_version  -->  portfolio : portfolio_id:id
can_version  -->  transaction : transaction_id:id
change_request  -->  agreement : agreement_id:id
change_request  -->  budget_line_item : budget_line_item_id:id
change_request  -->  division : managing_division_id:id
change_request  -->  ops_user : updated_by:id
change_request  -->  ops_user : created_by:id
change_request  -->  ops_user : reviewed_by_id:id
change_request_version  -->  agreement : agreement_id:id
change_request_version  -->  budget_line_item : budget_line_item_id:id
change_request_version  -->  transaction : transaction_id:id
clin  -->  contract_agreement : contract_agreement_id:id
clin  -->  ops_user : created_by:id
clin  -->  ops_user : updated_by:id
clin_version  -->  contract_agreement : contract_agreement_id:id
clin_version  -->  transaction : transaction_id:id
contact  -->  ops_user : updated_by:id
contact  -->  ops_user : created_by:id
contact_version  -->  transaction : transaction_id:id
contract_agreement  -->  agreement : id
contract_agreement  -->  ops_user : cotr_id:id
contract_agreement  -->  vendor : vendor_id:id
contract_agreement_version  -->  transaction : transaction_id:id
contract_agreement_version  -->  vendor : vendor_id:id
contract_budget_line_item  -->  agreement_mod : mod_id:id
contract_budget_line_item  -->  budget_line_item : id
contract_budget_line_item  -->  clin : clin_id:id
contract_budget_line_item  -->  services_component : services_component_id:id
contract_budget_line_item_version  -->  clin : clin_id:id
contract_budget_line_item_version  -->  services_component : services_component_id:id
contract_budget_line_item_version  -->  transaction : transaction_id:id
contract_support_contacts  -->  contract_agreement : contract_id:id
contract_support_contacts  -->  ops_user : users_id:id
contract_support_contacts_version  -->  transaction : transaction_id:id
direct_agreement  -->  agreement : id
direct_agreement_version  -->  transaction : transaction_id:id
direct_obligation_budget_line_item  -->  budget_line_item : id
direct_obligation_budget_line_item_version  -->  transaction : transaction_id:id
division  -->  ops_user : created_by:id
division  -->  ops_user : division_director_id:id
division  -->  ops_user : deputy_division_director_id:id
division  -->  ops_user : updated_by:id
division_version  -->  transaction : transaction_id:id
document  -->  agreement : agreement_id:id
document  -->  document : document_id:id
document  -->  ops_user : updated_by:id
document  -->  ops_user : created_by:id
document_version  -->  agreement : agreement_id:id
document_version  -->  document : document_id:id
document_version  -->  transaction : transaction_id:id
grant_agreement  -->  agreement : id
grant_agreement_version  -->  transaction : transaction_id:id
grant_budget_line_item  -->  budget_line_item : id
grant_budget_line_item  -->  grant_budget_line_item_detail : details_id:id
grant_budget_line_item_detail  -->  ops_user : updated_by:id
grant_budget_line_item_detail  -->  ops_user : created_by:id
grant_budget_line_item_detail_version  -->  transaction : transaction_id:id
grant_budget_line_item_version  -->  transaction : transaction_id:id
group  -->  ops_user : updated_by:id
group  -->  ops_user : created_by:id
group_version  -->  transaction : transaction_id:id
iaa_agreement  -->  agreement : id
iaa_agreement  -->  iaa_customer_agency : iaa_customer_agency_id:id
iaa_agreement_version  -->  iaa_customer_agency : iaa_customer_agency_id:id
iaa_agreement_version  -->  transaction : transaction_id:id
iaa_budget_line_item  -->  budget_line_item : id
iaa_budget_line_item_version  -->  transaction : transaction_id:id
iaa_customer_agency  -->  object_class_code : object_class_code_id:id
iaa_customer_agency  -->  ops_user : updated_by:id
iaa_customer_agency  -->  ops_user : created_by:id
iaa_customer_agency_contacts  -->  contact : contact_id:id
iaa_customer_agency_contacts  -->  iaa_customer_agency : iaa_customer_agency_id:id
iaa_customer_agency_contacts  -->  ops_user : updated_by:id
iaa_customer_agency_contacts  -->  ops_user : created_by:id
iaa_customer_agency_contacts_version  -->  contact : contact_id:id
iaa_customer_agency_contacts_version  -->  iaa_customer_agency : iaa_customer_agency_id:id
iaa_customer_agency_contacts_version  -->  transaction : transaction_id:id
iaa_customer_agency_version  -->  object_class_code : object_class_code_id:id
iaa_customer_agency_version  -->  transaction : transaction_id:id
invoice  -->  budget_line_item : budget_line_item_id:id
invoice  -->  ops_user : updated_by:id
invoice  -->  ops_user : created_by:id
invoice_version  -->  budget_line_item : budget_line_item_id:id
invoice_version  -->  transaction : transaction_id:id
notification  -->  change_request : change_request_id:id
notification  -->  ops_user : recipient_id:id
notification  -->  ops_user : created_by:id
notification  -->  ops_user : updated_by:id
notification_version  -->  change_request : change_request_id:id
notification_version  -->  transaction : transaction_id:id
object_class_code  -->  ops_user : created_by:id
object_class_code  -->  ops_user : updated_by:id
object_class_code_version  -->  transaction : transaction_id:id
ops_db_history  -->  ops_user : updated_by:id
ops_db_history  -->  ops_user : created_by:id
ops_db_history_version  -->  transaction : transaction_id:id
ops_event  -->  ops_user : updated_by:id
ops_event  -->  ops_user : created_by:id
ops_event_version  -->  transaction : transaction_id:id
ops_user  -->  division : division:id
ops_user  -->  ops_user : updated_by:id
ops_user  -->  ops_user : created_by:id
ops_user_version  -->  transaction : transaction_id:id
portfolio  -->  division : division_id:id
portfolio  -->  ops_user : updated_by:id
portfolio  -->  ops_user : created_by:id
portfolio_team_leaders  -->  ops_user : created_by:id
portfolio_team_leaders  -->  ops_user : team_lead_id:id
portfolio_team_leaders  -->  ops_user : updated_by:id
portfolio_team_leaders  -->  portfolio : portfolio_id:id
portfolio_team_leaders_version  -->  portfolio : portfolio_id:id
portfolio_team_leaders_version  -->  transaction : transaction_id:id
portfolio_url  -->  ops_user : updated_by:id
portfolio_url  -->  ops_user : created_by:id
portfolio_url  -->  portfolio : portfolio_id:id
portfolio_url_version  -->  portfolio : portfolio_id:id
portfolio_url_version  -->  transaction : transaction_id:id
portfolio_version  -->  division : division_id:id
portfolio_version  -->  transaction : transaction_id:id
procurement_acquisition_planning  -->  ops_user : completed_by:id
procurement_acquisition_planning  -->  procurement_step : id
procurement_acquisition_planning_version  -->  transaction : transaction_id:id
procurement_award  -->  ops_user : completed_by:id
procurement_award  -->  procurement_step : id
procurement_award_version  -->  transaction : transaction_id:id
procurement_evaluation  -->  ops_user : completed_by:id
procurement_evaluation  -->  procurement_step : id
procurement_evaluation_version  -->  transaction : transaction_id:id
procurement_pre_solicitation  -->  ops_user : completed_by:id
procurement_pre_solicitation  -->  procurement_step : id
procurement_pre_solicitation_version  -->  transaction : transaction_id:id
procurement_preaward  -->  ops_user : completed_by:id
procurement_preaward  -->  procurement_step : id
procurement_preaward_version  -->  transaction : transaction_id:id
procurement_shop  -->  ops_user : created_by:id
procurement_shop  -->  ops_user : updated_by:id
procurement_shop_fee  -->  ops_user : updated_by:id
procurement_shop_fee  -->  ops_user : created_by:id
procurement_shop_fee  -->  procurement_shop : procurement_shop_id:id
procurement_shop_fee_version  -->  procurement_shop : procurement_shop_id:id
procurement_shop_fee_version  -->  transaction : transaction_id:id
procurement_shop_version  -->  transaction : transaction_id:id
procurement_solicitation  -->  ops_user : completed_by:id
procurement_solicitation  -->  procurement_step : id
procurement_solicitation_version  -->  transaction : transaction_id:id
procurement_step  -->  agreement : agreement_id:id
procurement_step  -->  ops_user : updated_by:id
procurement_step  -->  ops_user : created_by:id
procurement_step  -->  procurement_tracker : procurement_tracker_id:id
procurement_step_version  -->  agreement : agreement_id:id
procurement_step_version  -->  procurement_tracker : procurement_tracker_id:id
procurement_step_version  -->  transaction : transaction_id:id
procurement_tracker  -->  agreement : agreement_id:id
procurement_tracker  -->  ops_user : created_by:id
procurement_tracker  -->  ops_user : updated_by:id
procurement_tracker  -->  procurement_step : current_step_id:id
procurement_tracker_version  -->  agreement : agreement_id:id
procurement_tracker_version  -->  transaction : transaction_id:id
product_service_code  -->  ops_user : updated_by:id
product_service_code  -->  ops_user : created_by:id
product_service_code_version  -->  transaction : transaction_id:id
project  -->  ops_user : created_by:id
project  -->  ops_user : updated_by:id
project_team_leaders  -->  ops_user : updated_by:id
project_team_leaders  -->  ops_user : created_by:id
project_team_leaders  -->  ops_user : team_lead_id:id
project_team_leaders  -->  project : project_id:id
project_team_leaders_version  -->  project : project_id:id
project_team_leaders_version  -->  transaction : transaction_id:id
project_version  -->  transaction : transaction_id:id
requisition  -->  budget_line_item : budget_line_item_id:id
requisition  -->  ops_user : updated_by:id
requisition  -->  ops_user : created_by:id
requisition_version  -->  budget_line_item : budget_line_item_id:id
requisition_version  -->  transaction : transaction_id:id
research_project  -->  project : id
research_project_version  -->  transaction : transaction_id:id
role  -->  ops_user : created_by:id
role  -->  ops_user : updated_by:id
role_version  -->  transaction : transaction_id:id
services_component  -->  contract_agreement : contract_agreement_id:id
services_component  -->  ops_user : updated_by:id
services_component  -->  ops_user : created_by:id
services_component_version  -->  contract_agreement : contract_agreement_id:id
services_component_version  -->  transaction : transaction_id:id
shared_portfolio_cans  -->  can : can_id:id
shared_portfolio_cans  -->  ops_user : created_by:id
shared_portfolio_cans  -->  ops_user : updated_by:id
shared_portfolio_cans  -->  portfolio : portfolio_id:id
shared_portfolio_cans_version  -->  can : can_id:id
shared_portfolio_cans_version  -->  portfolio : portfolio_id:id
shared_portfolio_cans_version  -->  transaction : transaction_id:id
user_group  -->  group : group_id:id
user_group  -->  ops_user : created_by:id
user_group  -->  ops_user : user_id:id
user_group  -->  ops_user : updated_by:id
user_group_version  -->  group : group_id:id
user_group_version  -->  transaction : transaction_id:id
user_role  -->  ops_user : created_by:id
user_role  -->  ops_user : user_id:id
user_role  -->  ops_user : updated_by:id
user_role  -->  role : role_id:id
user_role_version  -->  role : role_id:id
user_role_version  -->  transaction : transaction_id:id
user_session  -->  ops_user : updated_by:id
user_session  -->  ops_user : created_by:id
user_session  -->  ops_user : user_id:id
user_session_version  -->  transaction : transaction_id:id
vendor  -->  ops_user : updated_by:id
vendor  -->  ops_user : created_by:id
vendor_contacts  -->  contact : contact_id:id
vendor_contacts  -->  ops_user : updated_by:id
vendor_contacts  -->  ops_user : created_by:id
vendor_contacts  -->  vendor : vendor_id:id
vendor_contacts_version  -->  contact : contact_id:id
vendor_contacts_version  -->  transaction : transaction_id:id
vendor_contacts_version  -->  vendor : vendor_id:id
vendor_version  -->  transaction : transaction_id:id
