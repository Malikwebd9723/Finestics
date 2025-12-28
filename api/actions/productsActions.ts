import { apiRequest } from "api/clients";

// Dummy API Functions
export const fetchProducts = async () => {
    const response = await apiRequest("/products", "GET");
    return response.data;

};

export const addProducts = async (data: any) => {
    const response = await apiRequest("/products", "POST", data);
    return response.data;
};

export const updateProducts = async (id: string, data: any) => {
    const response = await apiRequest(`/products/${id}`, "PUT", data);
    return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
    const response = await apiRequest(`/products/${id}`, "DELETE");
    return response.data;
};

export const fetchTags = async () => {
    const response = await apiRequest("/products/tags", "GET");
    return response.data.data || response.data;
};