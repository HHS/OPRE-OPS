# CAN Funding vs. Spending: Why They Don't Map 1:1

## The Core Distinction

- **Funding** = money flowing INTO a CAN (`CANFundingBudget`)
- **Spending** = money flowing OUT of a CAN via budget line items (`BudgetLineItem.amount`)

A CAN's funding budget is a pool. Multiple projects draw from the same pool.
There is no mechanism in the data model to say "$X of this CAN's budget belongs to Project A."

## Diagram

```
                          FUNDING SIDE                          SPENDING SIDE
                     (CANFundingBudget)                    (BudgetLineItem.amount)
                     money coming IN                        money going OUT


                    +------------------+
                    |   CAN G123456    |
                    |   Portfolio: CW  |
                    |   1-Year CAN     |
                    +------------------+
                    | FY2025 Budget:   |
                    |   $2,000,000     |           +----------- Project A: "Child Welfare Study" -----------+
                    +--------+---------+           |                                                        |
                             |                     |  Agreement #101 (Contract)                              |
                             |                     |    BLI #1  -----> CAN G123456  amount: $500,000         |
                             |                     |    BLI #2  -----> CAN G123456  amount: $300,000         |
                             |                     |                                                        |
                             |  shared pool        +--------------------------------------------------------+
                             |  of $2M
                             |                     +----------- Project B: "Family Support Research" -------+
                             |                     |                                                        |
                             |                     |  Agreement #205 (Grant)                                 |
                             |                     |    BLI #5  -----> CAN G123456  amount: $400,000         |
                             |                     |                                                        |
                             |                     |  Agreement #210 (Contract)                              |
                             |                     |    BLI #8  -----> CAN G123456  amount: $200,000         |
                             |                     |                                                        |
                             |                     +--------------------------------------------------------+
                             |
                             |                     +----------- Project C: "Admin Support" -----------------+
                             |                     |                                                        |
                             |                     |  Agreement #312 (Direct Obligation)                     |
                             |                     |    BLI #12 -----> CAN G123456  amount: $100,000         |
                             |                     |                                                        |
                             v                     +--------------------------------------------------------+

                    Total Funding: $2,000,000
                    Total Spending: $1,500,000      ($500k + $300k + $400k + $200k + $100k)
                    Remaining:       $500,000
```

## What Each Project "Sees"

When Project A asks "what is my funding?", there are two possible answers:

### Answer 1: CAN-level funding (what we implemented)

> "Your project uses CAN G123456, which has $2,000,000 in FY2025 budget."

This is the **full CAN budget** -- the same $2M that Projects B and C also see.
It answers: "What funding sources back my project, and how much is in them?"

### Answer 2: BLI-level spending (not what this endpoint does)

> "Your project has $800,000 in budget line items drawing from CAN G123456."

This is the **project-scoped allocation** -- only BLIs on Project A's agreements.
It answers: "How much is my project spending from this CAN?"

### Why we chose Answer 1

The `/projects/{id}/funding/` endpoint surfaces **funding** (Answer 1), not spending.
The overlap between projects is intentional and expected -- it shows the full picture
of the funding sources available to a project's CANs.

If you sum up "project funding" across all projects sharing a CAN, the total will
exceed the CAN's actual budget. That's correct -- it's not double-counting, it's
showing each project the full context of its funding sources.

## Multi-Year CAN Example (Carry-Forward)

```
                    +---------------------+
                    |   CAN G789012       |
                    |   Portfolio: HMRF   |
                    |   5-Year CAN        |
                    |   Appropriation: FY2022
                    +---------------------+
                    | FY2022 Budget: $500k |  <-- "new funding" (appropriation year)
                    | FY2023 Budget: $200k |  <-- "carry-forward" (past appropriation year)
                    | FY2024 Budget: $150k |  <-- "carry-forward"
                    | FY2025 Budget: $300k |  <-- "carry-forward"
                    +---------------------+

    When querying fiscal_year=2025:
      new_funding:           $0        (appropriation year 2022 != 2025, not 1-year CAN)
      carry_forward_funding: $300,000  (FY2025 budget on a multi-year CAN past appropriation)
      total:                 $300,000

    When querying fiscal_year=2022:
      new_funding:           $500,000  (appropriation year 2022 == 2022)
      carry_forward_funding: $0
      total:                 $500,000

    lifetime_funding:        $1,150,000 (sum of all FY budgets, always the same)
```
