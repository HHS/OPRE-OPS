export type SafeUser = {
    email: string;
    full_name: string;
    id: number;
};

export type UserRole = {
    id: number;
    name: string;
    is_superuser: boolean;
};

export type User = {
    display_name: string;
    division: number;
    email: string;
    first_name: string;
    full_name: string;
    hhs_id?: number;
    id: number;
    last_name: string;
    oidc_id: string;
    roles: UserRole[];
    status: UserStatusValues;
    created_by?: number;
    created_on: Date;
    updated_by?: number;
    updated_on: Date;
};

type UserStatusValues = (typeof UserStatus)[keyof typeof UserStatus];
