import { apiRequest } from "api/clients";

// services/customerService.ts
export const addCustomer = async (data: any) => {
    const res = await apiRequest("/vendor-customers", "POST", data);
    console.log("customer to add", res.data);
    
    return res.data;

};


// API function for all Customers
export const fetchAllCustomers = async () => {
    const res = await apiRequest("/vendor-customers", "GET");
    return res.data;
};
// API function for all Customers
export const fetchCustomersDetails = async (customerId: any) => {
    const res = await apiRequest(`/vendor-customers/${customerId}`, "GET");
    return res.data;
};

export const updateCustomer = async (data: any) => {
    const res = await apiRequest(`/vendor-customers/${data.id}`, "PUT", data);   
    return res.data;
};

export const deleteCustomer = async (customerId: number) => {
    const res = await apiRequest(`/vendor-customers/${customerId}`, "DELETE");
    return res.data;
};