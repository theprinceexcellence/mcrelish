import { api, type Role } from "./api";

export type StaffMember = { user_id: string; email: string; roles: Role[] };

export const listStaff = () => api<{ staff: StaffMember[] }>("/api/admin/staff");
export const addStaffRole = ({ data }: { data: { email: string; role: Role } }) => api<{ ok: true }>("/api/admin/staff", { body: data });
export const removeStaffRole = ({ data }: { data: { userId: string; role: Role } }) => api<{ ok: true }>("/api/admin/staff/remove", { body: data });
