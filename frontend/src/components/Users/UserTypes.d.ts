import { UserRoles } from "./User.constants";

export type SafeUser = {
    email: string;
    full_name: string;
    id: number;
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
    roles: UserRolesValues[];
    status: UserStatus;
    created_by?: number;
    created_on: Date;
    updated_by?: number;
    updated_on: Date;
};

type UserRoleValues = (typeof UserRoles)[keyof typeof UserRoles];

type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
