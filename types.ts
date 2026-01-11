
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Hospital {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  location: string;
  distance: string;
  coords: LatLng;
  specialties: string[];
  currentToken: number;
  queueLength: number;
  avgConsultationTime: number;
  status: 'Open' | 'Limited' | 'Closed';
  image: string;
}

export interface Doctor {
  id: string;
  name: string;
  hospitalId: string;
  specialization: string;
  experience: string;
  fee: number;
  status: 'Consulting' | 'Next Available' | 'Offline';
  rating: number;
  slots: string[];
}

export interface PhysicalPharmacy {
  id: string;
  name: string;
  rating: number;
  distance: string;
  coords: LatLng;
  address: string;
  deliveryTime: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: 'Pain Relief' | 'Diabetes' | 'Heart' | 'General' | 'Personal Care';
  needsPrescription: boolean;
  stockAtStoreIds: string[];
}

export interface CartItem extends PharmacyItem {
  quantity: number;
}

export interface BookingToken {
  id: string;
  hospitalId: string;
  hospitalName: string;
  doctorName: string;
  tokenNumber: number;
  currentToken: number;
  status: 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled';
  appointmentTime: string;
  estimatedArrival: string;
  consultationFee: number;
  timestamp: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'Confirmed' | 'Packed' | 'Rider Assigned' | 'Out for Delivery' | 'Delivered';
  estimatedDelivery: string;
  fulfillingStoreName: string;
  riderCoords?: LatLng;
  storeCoords?: LatLng;
  destinationCoords?: LatLng;
}

export interface Prescription {
  id: string;
  doctor: string;
  hospital: string;
  date: string;
  diagnosis: string;
  medicines: { name: string; dosage: string; duration: string; instructions: string }[];
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface LabReport {
  id: string;
  testName: string;
  date: string;
  status: 'Pending' | 'Ready';
  results?: { parameter: string; value: string; range: string; unit: string }[];
}

export interface User {
  name: string;
  tokens: BookingToken[];
  prescriptions: Prescription[];
  orders: Order[];
  labReports: LabReport[];
  currentLocation: LatLng;
  activity: {
    steps: number;
    goal: number;
    distance: string;
    activeMinutes: number;
  };
}

export enum View {
  DASHBOARD = 'dashboard',
  DISCOVERY = 'discovery',
  PHARMACY = 'pharmacy',
  PROFILE = 'profile',
  TRACKING = 'tracking'
}

export type PaymentContext = 'consultation' | 'pharmacy';
