
// Removed unused HealthConcern from imports as it is not exported from types.ts
import { Hospital, PharmacyItem, LabTest, Doctor, PhysicalPharmacy, LatLng } from './types';

// Mock user is in Bandra West
export const USER_LOCATION: LatLng = { lat: 19.0607, lng: 72.8362 };

export const HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'City General Medical Center',
    rating: 4.8,
    reviews: 1250,
    location: 'Bandra West',
    distance: '0.8 km',
    coords: { lat: 19.0650, lng: 72.8400 },
    specialties: ['Cardiology', 'Internal Medicine', 'Emergency Care'],
    currentToken: 14,
    queueLength: 6,
    avgConsultationTime: 12,
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1586773860418-d3b978501fe8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'h2',
    name: 'Lilavati Hospital & Research',
    rating: 4.7,
    reviews: 3400,
    location: 'Bandra Reclamation',
    distance: '2.4 km',
    coords: { lat: 19.0510, lng: 72.8250 },
    specialties: ['Gastroenterology', 'Neurology', 'Pediatrics'],
    currentToken: 28,
    queueLength: 4,
    avgConsultationTime: 15,
    status: 'Open',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
  }
];

export const PHYSICAL_PHARMACIES: PhysicalPharmacy[] = [
  { 
    id: 's1', 
    name: 'MediLife Bandra West', 
    rating: 4.9, 
    distance: '0.4 km', 
    coords: { lat: 19.0620, lng: 72.8340 },
    address: 'Hill Road, Bandra', 
    deliveryTime: '25 mins' 
  },
  { 
    id: 's2', 
    name: 'Wellness Forever', 
    rating: 4.6, 
    distance: '1.5 km', 
    coords: { lat: 19.0580, lng: 72.8420 },
    address: 'Linking Road', 
    deliveryTime: '45 mins' 
  }
];

export const DOCTORS: Doctor[] = [
  { id: 'd1', hospitalId: 'h1', name: 'Dr. Sarah Wilson', specialization: 'Cardiologist', experience: '12 Years', fee: 1200, status: 'Consulting', rating: 4.9, slots: ['10:00 AM', '10:30 AM', '11:00 AM', '04:00 PM'] },
  { id: 'd2', hospitalId: 'h2', name: 'Dr. James Miller', specialization: 'Internal Medicine', experience: '8 Years', fee: 800, status: 'Next Available', rating: 4.7, slots: ['09:30 AM', '11:30 AM', '02:00 PM', '05:00 PM'] },
  { id: 'd3', hospitalId: 'h1', name: 'Dr. Elena Rodriguez', specialization: 'Neurologist', experience: '15 Years', fee: 1500, status: 'Consulting', rating: 4.8, slots: ['09:00 AM', '10:45 AM', '01:00 PM', '03:15 PM'] }
];

export const PHARMACY_ITEMS: PharmacyItem[] = [
  {
    id: 'p1',
    name: 'Metformin 500mg (SR)',
    brand: 'Abbott',
    price: 156,
    oldPrice: 180,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300',
    category: 'Diabetes',
    needsPrescription: true,
    stockAtStoreIds: ['s1', 's2']
  },
  {
    id: 'p2',
    name: 'Crocin Pain Relief',
    brand: 'GSK',
    price: 32,
    oldPrice: 40,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300',
    category: 'Pain Relief',
    needsPrescription: false,
    stockAtStoreIds: ['s1', 's2']
  }
];

export const LAB_TESTS: LabTest[] = [
  { id: 'l1', name: 'Full Body Checkup', price: 2999, category: 'Wellness' },
  { id: 'l2', name: 'HbA1c Diabetes Screen', price: 650, category: 'Diabetes' },
  { id: 'l3', name: 'Vitamin D3 / B12', price: 1200, category: 'General' }
];

export const CONCERNS = [
  { name: 'General Health', icon: '🌡️', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Cardiology', icon: '❤️', color: 'bg-rose-50 text-rose-600' },
  { name: 'Endocrinology', icon: '🩸', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Gastro', icon: '💊', color: 'bg-amber-50 text-amber-600' },
  { name: 'Orthopedics', icon: '🦴', color: 'bg-blue-50 text-blue-600' },
];
