import { apiRequest, getErrorMessage } from "api/clients";

/** Throw if the API response indicates failure */
function throwIfError(res: { success: boolean; data: any }, fallback: string) {
    if (!res.success) {
        throw new Error(getErrorMessage(res.data, fallback));
    }
}

// API Functions
export const fetchUserDetail = async (userId: number) => {
    const res = await apiRequest(`/users/${userId}`, "GET");
    throwIfError(res, "Failed to load user details");
    return res.data;  // Return data for queries
};

export const approveUser = async (userId: number) => {
    // Note: Users don't have approve endpoint like vendors
    // Use status update instead
    const res = await apiRequest(`/users/${userId}/status`, "PATCH", { accountStatus: "active" });
    return res;
};

export const rejectUser = async (userId: number, rejectionReason: string) => {
    // Note: Users don't have reject endpoint like vendors
    // Use status update instead
    const res = await apiRequest(`/users/${userId}/status`, "PATCH", { accountStatus: "suspended" });
    return res;
};

export const updateUserRole = async (userId: number, role: string) => {
    const res = await apiRequest(`/users/${userId}/role`, "PATCH", { role });
    return res;
};

export const updateAccountStatus = async (userId: number, accountStatus: string) => {
    const res = await apiRequest(`/users/${userId}/status`, "PATCH", { accountStatus });
    return res;
};

export const deleteUserAccount = async (userId: number) => {
    const res = await apiRequest(`/users/${userId}`, "DELETE");
    return res;
};

export const fetchPendingCustomers = async () => {
    const res = await apiRequest("/users?accountStatus=pending", "GET");
    return res;
};

export const fetchPendingVendors = async () => {
    const res = await apiRequest("/vendors/pending", "GET");
    return res;
};