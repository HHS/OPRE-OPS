select contract_name,
       sys_contract_id,
       sys_project_id,
       sys_vendor_id,
       contract_nbr,
       task_order_nbr,
       po_nbr,
       CASE
           WHEN c.sys_acquisition_type_id = 1 THEN 'GSA_SCHEDULE'
           WHEN c.sys_acquisition_type_id = 2 THEN 'TASK_ORDER'
           WHEN c.sys_acquisition_type_id = 3 THEN 'FULL_AND_OPEN'
       END AS acquisition_type,
      CASE
          WHEN c.sys_psc_code_id = 1 THEN '541690'
          WHEN c.sys_psc_code_id = 2 THEN '561920'
      END AS psc_code
FROM contract c
ORDER BY sys_contract_id;
