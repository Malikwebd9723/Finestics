import { apiRequest } from "api/clients";

// API Functions
export const fetchUserDetail = async (userId: number) => {
    const res = await apiRequest(`/admin/approvals/${userId}`, "GET");
    return res.data;
};

export const approveUser = async (userId: number) => {
    const res = await apiRequest(`/admin/approvals/${userId}/approve`, "POST");
    return res.data;
};

export const rejectUser = async (userId: number, rejectionReason: string) => {
    const res = await apiRequest(`/admin/approvals/${userId}/reject`, "POST", {
        rejectionReason,
    });
    return res.data;
};

export const updateUserRole = async (userId: number, role: string) => {
    const res = await apiRequest(`/users/${userId}/role`, "PATCH", { role });
    return res.data;
};

export const updateAccountStatus = async (userId: number, accountStatus: string) => {
    const res = await apiRequest(`/users/${userId}/status`, "PATCH", { accountStatus });
    return res.data;
};

export const deleteUserAccount = async (userId: number) => {
    const res = await apiRequest(`/users/${userId}`, "DELETE");
    return res.data;
};

export const fetchPendingCustomers = async () => {
    const res = await apiRequest("/admin/approvals/customers/pending", "GET");
    return res.data;
};

export const fetchPendingVendors = async () => {
    const res = await apiRequest("/admin/approvals/vendors/pending", "GET");
    return res.data;
};