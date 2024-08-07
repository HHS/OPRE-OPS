-- Change the project officer for Agreements 1, 9, and 10 to "Director Dave" (ops_user id = 522).
UPDATE ops.agreement SET agreement_type = 'CONTRACT', name = 'Contract Workflow Test', description = 'Test description', product_service_code_id = 1, agreement_reason = 'RECOMPETE', project_officer_id = 522, project_id = 1000, procurement_shop_id = 1, notes = '', created_by = 503, updated_by = null, created_on = '2024-07-29 19:42:12.298022', updated_on = '2024-07-29 19:42:12.298022' WHERE id = 10;
UPDATE ops.agreement SET agreement_type = 'CONTRACT', name = 'Interoperability Initiatives', description = 'Test description', product_service_code_id = 1, agreement_reason = 'NEW_REQ', project_officer_id = 522, project_id = 1002, procurement_shop_id = 3, notes = '', created_by = 503, updated_by = null, created_on = '2024-07-29 19:42:12.284954', updated_on = '2024-07-29 19:42:12.284954' WHERE id = 9;
UPDATE ops.agreement SET agreement_type = 'CONTRACT', name = 'Contract #1: African American Child and Family Research Center', description = 'Test description', product_service_code_id = 1, agreement_reason = 'RECOMPETE', project_officer_id = 522, project_id = 1000, procurement_shop_id = 1, notes = '', created_by = 503, updated_by = null, created_on = '2024-07-29 19:42:11.142604', updated_on = '2024-07-29 19:42:11.142604' WHERE id = 1;
-- Remove "Director Dave" (ops_user id = 522) as a team member for Agreements 1 and 10.
DELETE FROM ops.agreement_team_members WHERE agreement_id = 1 AND user_id = 522;
DELETE FROM ops.agreement_team_members WHERE agreement_id = 10 AND user_id = 522;
-- Change the status of budget line items (BLIs) for Agreement 10 to "PLANNED".
UPDATE ops.budget_line_item SET line_description = 'LI 2', comments = '', agreement_id = 10, can_id = 504, services_component_id = 7, clin_id = null, amount = 1000000.00, status = 'PLANNED', date_needed = '2043-06-13', proc_shop_fee_percentage = 0.00000, created_by = null, updated_by = null, created_on = '2024-07-29 19:42:12.427563', updated_on = '2024-07-29 19:42:12.427563', on_hold = false, certified = false, closed = false, mod_type = null WHERE id = 15023;
-- Add the user "User Demo" (ops_user id = 521) as a team member for Agreements 1, 9, and 10.
INSERT INTO ops.agreement_team_members (agreement_id, user_id) VALUES (1, 521);
INSERT INTO ops.agreement_team_members (agreement_id, user_id) VALUES (9, 521);
INSERT INTO ops.agreement_team_members (agreement_id, user_id) VALUES (10, 521);
