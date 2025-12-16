export interface UserDataType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  accountStatus: string;
  profileImage: string | null;
  createdAt: string;
  vendorProfile: any;
  customerProfile: any;
  lastLoginAt: string;
}


export interface ApiResponse {
  success: boolean;
  data: UserDataType[];
  pagination: any;
}

export interface Address {
    id: number;
    type: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
}

export interface Profile {
    id: number;
    userId: number;
    businessName: string;
    businessType: string;
    description: string;
    taxId: string | null;
    businessLicense: string;
    status: string;
    businessPhone: string;
    businessEmail: string;
    website: string;
    preferredDeliveryTime: string;
    specialInstructions: string;
    creditLimit: string;
    outstandingBalance: string;
    addresses: Address[];
}

export interface Payment {
    id: number;
    amount: string;
    currency: string;
    status: string;
    validFrom: string | null;
    validUntil: string | null;
    paidAt: string | null;
    selectedPlan: {
        id: number;
        name: string;
        duration: number;
        price: string;
        currency: string;
    };
}


export interface UserDetailResponse {
    success: boolean;
    data: {
        user: UserDataType;
        profile: Profile;
        payments: Payment[];
    };
}

export interface UserDetailModalProps {
    visible: boolean;
    userId: number | null;
    onClose: () => void;
}