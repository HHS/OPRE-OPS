export type GrantNumber = {
    agreement_id: number;
    created_by: number;
    created_on: Date;
    description: string;
    display_name: string;
    display_title: string;
    id: number;
    number: number;
    period_end: string;
    period_start: string;
    updated_by: number;
    updated_on: Date;
    // Award-time fields: not captured until the grant is awarded and not yet serialized by the
    // backend. Optional so the view can bind to them now and fall back to "TBD" until data exists.
    grantee_name?: string;
    organization_type?: string;
    state?: string;
};
