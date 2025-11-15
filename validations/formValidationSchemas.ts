import * as Yup from "yup";

export const categorySchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  purchase: Yup.string()
    .required("Purchase price is required"),
  selling: Yup.string()
    .required("Selling price is required"),
  unit: Yup.string().required("Unit is required"),
  status: Yup.string().required("Status is required"),
});
