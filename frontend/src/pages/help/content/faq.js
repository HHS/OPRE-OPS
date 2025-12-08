// Markdown Guide https://www.markdownguide.org/basic-syntax/
export const data = [
    {
        heading: "What is OPS?",
        content: `OPS is the acronym for **O**PRE’s **P**ortfolio **M**anagement **S**ystem. It is a centralized place to plan and track OPRE’s budget and projects across Divisions and Portfolios.

OPS is a custom software application replacing OPRE’s legacy system known as the Management and Accounting of Projects System (MAPS). OPS has been designed using a human-centered design approach where everyday users are active participants in the design and direction of the system. OPS is currently in an early release and will continue to be expanded upon and improved as OPRE is using it. Your feedback is essential in making OPS a successful tool for all, so don’t hesitate to share your thoughts and ideas!
`
    },
    {
        heading: "What benefits does OPS provide?",
        content: `**Transparency**<br/>
You can view high-level budget, spending, and research data for each Portfolio and funding details for every CAN. Changes are tracked via history so you can easily understand who changed what and when.

**Data Visualization**<br/>
Budget and spending data can be viewed in a range of customized ways, like across a portfolio, project, or CAN, in addition to the individual agreement level.

**Autonomy**<br/>
Team Leaders, CORs, Project Officers, and other team members have the ability to create and edit their agreements directly, eliminating the need to email the budget team for updates.

**Built-in Approvals**<br/>
Division Directors will formally approve budget and status changes in the system rather than through email.


**Real-time Planning**<br/>
Plans can be entered into the system as Drafts instead of having to wait until plans are more formalized. This will provide a more holistic view of the data across all stages of planning.
`
    },
    {
        heading: "How is OPS organized?",
        content: `**The portfolio, project, and agreement relationship** <br/>
Each OPRE division has one or more portfolios. Within each portfolio, projects can be created to assist in grouping different agreements together. There are different types of agreements, which are contracts, grants, inter-agency agreements (IAAs), assisted acquisitions (AAs), and direct obligations.

**Definitions for portfolios, projects, and agreements** <br/>
- Portfolio - a portfolio is a research focus area or funding stream within OPRE
- Project - a project is a body of work composed of agreements that share a common topic or theme (often a research-related agenda or goal)
- Agreement - an agreement is a defined piece of work (possibly a subset of a broader project), often between OPRE and other contractors

**The agreement lifecycle and budget line statuses** <br/>
Budget line statuses are used to track the current state of an agreement. There are six budget line statuses. All new budget lines start in Draft Status.

| Budget line (BL) Status | Meaning |
|-----------|---------|
| Draft              | Budget line is in pre-planning, placeholders and what-ifs, not yet solidified |
| Planned            | Budget line is intended to happen and money can be set aside as planned (even though there might be changes). The dollar amount associated to the budget line will be subtracted from the available FY budget |
| Executing          | Budget line is in the procurement process, in progress to be formally committed |
| Obligated          | Budget line is committed in the signed award and can be invoiced against so the work can begin |
| In Review          | Budget line has pending edits or a pending status change request that needs to be approved or declined |
| OBE                | Budget line is “overcome by events” and is no longer happening. The budget line amount is still included in the agreement total, but not subtracted from any CANs |
`
    },
    {
        heading: "How do user roles and permissions work in OPS?",
        content: `**Overview of OPS user roles**
- Viewer/Editor
- Reviewer/Approver
- Budget Team
- Procurement Team

**What user role do I have?** <br/>
View your user role by clicking on your email address link at the top of your screen (for step-by-step instructions, check out the [How-tos](/help-center)).

**Viewer/Editor** <br/>
People with the Viewer/Editor role are generally Team Leaders, Project Officers (CORs/FPOs), Alternate Project Officers (Alternate COR/Alternate FPO), or other team members like Research Analysts, Management Analysts, or Program Analysts.

Individuals with a viewer/editor role are able to:
- View all portfolios, agreements, and CANs
- Create agreements
- Edit agreements if you’re listed as a team member on the agreement
- Request a status change on budget lines if you’re listed as a team member on the agreement
- Complete the procurement tracker tasks for their agreements [not yet developed, coming soon]
- Start a contract modification [not yet developed, coming soon]
- Create, view and edit projects [not yet developed, coming soon]

**Reviewer/Approver** <br/>
People with the Reviewer/Approver role are generally Division Directors or Deputy Directors who oversee the budget across their division and portfolios.

Individuals with a reviewer/approver role are able to:
- View all portfolios, agreements, and CANs
- Create agreements
- Edit agreements if you’re listed as a team member on the agreement
- Review and approve budget changes for budget lines using CANs within their division
- Review and approve budget line status changes for budget lines using CANs within their division
- Review and approve team member changes for any agreements within their division [not yet developed, coming soon]
- Review and approve the pre-award procurement step for agreements within their division [not yet developed, coming soon]
- Review and approve contract modifications for agreements within their division [not yet developed, coming soon]
- Create, view, and edit projects  [not yet developed, coming soon]

**Budget Team** <br/>
People on the budget team are responsible for overseeing the budget across OPRE, forecasting trends in spending and budgets, and balancing the budget across external systems.

Individuals with a budget team role are able to:
- View all portfolios, agreements, and CANs
- Create agreements
- Edit agreements if you’re listed as a team member on the agreement
- Edit CAN details, FY budget, and update funding received to OPRE
- Review and approve all agreements for the pre-award step of the procurement tracker [not yet developed, coming soon]
- Review the final consensus memo
- Submit the requisition and write a check for the total in executing status
- Review and approve all agreements for the award step of the procurement tracker [not yet developed, coming soon]
- Ensure CLINs entered by CORs match the signed award
- Review vendor information entered by CORs
- Review the award information entered by CORs
- Enter the obligated date for budget lines in executing status
- Create, view, and edit projects  [not yet developed, coming soon]

**Procurement Team** <br/>
People on the procurement team track the procurement process across OPRE and help coordinate between CORs and the procurement shops.

Individuals with a procurement team role are able to:
- View all portfolios, agreements, and CANs
- Create agreements
- Edit agreements if you’re listed as a team member on the agreement
- View the status of procurement tasks across all agreements [not yet developed, coming soon]
- Reset procurement steps, if needed [not yet developed, coming soon]
- Create, view, and edit projects [not yet developed, coming soon]
        `
    },
    {
        heading: "How do I request a new OPS account or re-activate an existing one?",
        content: `You can request a new OPS account or re-activate an existing one by submitting a Budget Support Request through [ORBIT](https://opre-orbit.zendesk.com). Select Access to OPS under the Request For option. For more detailed step-by-step instructions, check-out the how-to-guide on how to share OPS feedback or get support through ORBIT.
`
    },
    {
        heading: "How do I learn how to use OPS?",
        content: `You can learn how to use OPS by checking out the [How-to Guides](/help-center), attending office hours, or reaching out for help by submitting a Budget Support Request through [ORBIT](https://opre-orbit.zendesk.com).
`
    },
    {
        heading: "What functionality is currently available to everyone in OPS?",
        content: `
- View all portfolios across OPRE, including their FY budget and spending
- View a list of all agreements across OPRE
- View a list of My Agreements (agreements you are listed as a team member on)
- Create a new agreement (contracts and assisted acquisitions only)
- View an Agreement Details page
- Edit an agreement including budget line status changes (contracts and assisted acquisitions only)
- Built-in approvals from Division Directors on any budget changes or status changes
- View a list of all CANs across OPRE
- View a list of My CANs (a list of all CANs associated with your agreements)
- View a CAN Details page, including the FY budget and spending
- View a list of all budget lines across OPRE
- View a list of My Budget Lines (budget lines from agreements you are listed as a team member on)
- View notifications and a history of changes
- Export data from the Agreements List, Budget Lines List or Agreement Details Page
`
    },
    {
        heading: "What functionality will be added to OPS in the future?",
        content: `
OPS will continue to get new features and improvements on a regular basis. If you have ideas, please share your feedback by submitting a Budget Support Request through [ORBIT](https://opre-orbit.zendesk.com). A few items on our list so far include:

- View a Portfolio’s People & Teams information
- Create, view, or edit other agreement types like Grants, IAAs, and Direct Obligations
- Utilize an in-app Procurement Tracker with steps and progress through the procurement process
- Create, view, or edit Projects
- Start contract modifications
- Download detailed reports
- Manage invoicing
- Email notifications
`
    },
    {
        heading:
            "What's the process for updating or editing our agreements while OPS is still being actively developed?",
        content: `You can edit/update your agreements that are contracts or assisted acquisitions directly in OPS. However, other agreement types are not fully developed yet and cannot be edited in OPS yet. The pages that are not editable will have an alert at the top so you know which pages aren’t fully developed yet. Thank you for your patience on this!
`
    },
    {
        heading: "What data is not editable in OPS yet?",
        content: `
- Creating or editing Grants
- Creating or editing other Partner Agreements like IAAs, IDDAs or IPAs
- Creating or editing Direct Obligations
- Changing a BL status from Executing to Obligated on a contract and the associated procurement steps
`
    },
    {
        heading: "How do we update data that is not editable in OPS yet?",
        content: `
If you need to change something in OPS that's not editable yet, email the budget team requesting the update. The Budget Team will update the OPRE budget spreadsheet, and the OPS team will sync updates between the OPRE budget spreadsheet and OPS on a daily basis. Depending on when the change is entered into the spreadsheet, your update should show up in OPS within a day or two.
`
    },
    {
        heading: "How do approvals work for cross-portfolio agreements?",
        content: `
For cross-portfolio or shared work, you would just choose the CANs for each budget line, and budget or status changes will go to the respective approvers for each CAN. Every CAN is assigned to a managing Portfolio, and approvers are determined through the Division of that Portfolio.
`
    },
    {
        heading:
            "What happens to budget lines that are in Planned Status, but then we decide not to move forward with them?",
        content: `If the agreement has not been awarded, you can delete any budget lines that are no longer needed. Your Division Director will need to review/approve any changes to budget lines in Planned Status. If the agreement has been awarded, please do not delete any budget lines that are not moving forward because it would impact the agreement total which we want to match the award. These budget lines should instead be marked as OBE or “overcome by events”. In order to do this, please reach out to the Budget Team by submitting a Budget Support Request through ORBIT. They can mark the budget line as OBE or “overcome by events”. Eventually, this will be available manually inside of OPS.
`
    },
    {
        heading: "Is there a way to create sub services components, such as SC2-A, SC2-B, SC2-C?",
        content: `Some legacy contracts from MAPS utilized sub-services components to break up work that repeat tasks in different contexts or timelines (for example, a panel review that spans several years). However, for ease of use and consistency in OPS, each numbered services component (SC1, SC2, SC3, etc) will only be used once. We are working on an improvement to enable custom titles next to each services component # so you can specify what each services component is for directly in its title. For now, you can also add any additional information into the services component description field.
`
    },
    {
        heading: "Where are the fee lines for Assisted Acquisitions?",
        content: `In OPS, when you view a budget line, the amount (award value) and the fee will be incorporated onto a single budget line which together comprise the budget line total. You will no longer need an additional line for the fee.
        `
    },
    {
        heading: "Do we still need $0 budget lines in OPS?",
        content: `$0 budget lines in OPS might be a result of an admin mod. If you see any remaining $0 budget lines that were migrated from MAPS to OPS, please do not delete them. We are working on a solution and an update will be shared soon.
        `
    },
    {
        heading: "Can I create or edit portfolios?",
        content: `OPS Portfolios are aligned to correspond to OPRE’s research portfolios and Divisions. Portfolios in OPS can only be changed by the OPS System Owner. The budget data within each portfolio is updated through each individual CAN within the portfolio. The spending data within each portfolio is updated through each individual agreement within the portfolio.
        `
    },
    {
        heading: "Will I receive an email notification when changes are made in OPS?",
        content: `For now, users will need to log into OPS to view notifications. You can see what’s happened by clicking the bell icon in the top right-hand side of the page or by viewing the history section on the Portfolio, Agreement, or CAN pages. Email notifications will be added in the near future, and we’ll send an update once they are ready!
        `
    },
    {
        heading: "Can I download data from OPS?",
        content: `OPS does not currently support downloading detailed reports. However, you can export raw data from the Agreements Page and Budget Lines page.  If you have ideas for reporting in OPS, please share your feedback by submitting a Budget Support Request through [ORBIT](https://opre-orbit.zendesk.com).
        `
    },
    {
        heading: "What's the format of the file name for exports?",
        content: `The file name for exports is formatted with YYYY-MM-DD-Time. The last 6 numbers are the timestamp of the export.
        `
    },
    {
        heading: "What's the format of the file name for exports?",
        content: `The file name for exports is formatted with YYYY-MM-DD-Time. The last 6 numbers are the timestamp of the export.
`
    },
    {
        heading: "Does OPS track invoicing?",
        content: `OPS does not currently track invoicing, but it’s on our to-do list. In the future, OPS will track invoices from the payment perspective, but approving will remain in IPP. If you have ideas for invoicing in OPS, please share your feedback by submitting a Budget Support Request through [ORBIT](https://opre-orbit.zendesk.com).
`
    },
    {
        heading: "Who changes budget line statuses, and when should they do it?",
        content: `It’s up to each team to decide how they will manage their agreements and keep them up to date in OPS. While the Budget Team was responsible for updating OPRE’s legacy system, now team members can make their own updates directly without waiting for someone else to do it for them.

Some teams might assign CORs to request the budget line status changes, but anyone who's listed as a Team Member on the agreement will be able to do it. The most important thing is that each team creates a process and makes sure OPS stays up to date in order to provide a holistic view of OPRE’s budget at all times. Division Directors are the approvers for budget line status changes.

An example of how it could work might look like this:

- In October through December, as Portfolio teams work on research planning, CORs can go into OPS to create new agreements and add budget lines in a Draft Status (you can always edit or delete what doesn’t get included in the actual plans, so feel free to jot down all your ideas and what-ifs directly into OPS)
- In December, after plans are reviewed with OPRE leadership, CORs would go into OPS to request a BL Status Change from Draft to Planned. Once approved by their Division Director, the amounts would be subtracted from the FY Budget.
- In February and in June, when acquisition plans are typically due, CORs would go into OPS to request a BL Status Change from Planned to Executing. This would take place whenever you are ready to start the procurement process.
- Finally, once the procurement process is completed and the contract has been awarded, the Budget Team‘s Award Approval will change the BL Status from Executing to Obligated
`
    },
    {
        heading: "Can I search for a specific agreement, budget line, or CAN?",
        content: `Currently, you can only search for specific agreements by typing in the agreement name in the agreement filters on the agreements list page. You cannot currently search for a specific budget line or CAN, but it’s on our to-do list and will be available in a future update.
`
    }
];
