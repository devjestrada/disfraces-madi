export interface Costume {
  id: string;
  name: string;
  category: 'Cumbia' | 'Garabato' | 'Mapalé' | 'Marimonda' | 'Negrita Puloy' | 'Congo' | 'Monocuco' | 'Muerte' | 'Fantasía';
  rating: number;
  reviewsCount: number;
  description: string;
  details: string[];
  fabrics: string[];
  accessories: string[];
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
  primaryImage: string;
  gallery: string[];
  rentalPrice: number;
  salePrice?: number;
  isAvailable: boolean;
  featured?: boolean;
  designer?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  costumeId: string;
  costumeName: string;
  bookingDate: string;
  bookingTime: string;
  fittingDate?: string;
  notes?: string;
  status: 'Pendiente' | 'Confirmada' | 'Entregada' | 'Completada' | 'Cancelada';
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  costumeId?: string;
  costumeName?: string;
  createdAt: string;
  status: 'Leída' | 'Pendiente' | 'Respondida';
}

export interface Review {
  id: string;
  author: string;
  role: string; // e.g., "Reina de la comparsa", "Bailarín de Cumbia"
  rating: number;
  comment: string;
  avatar: string;
  date: string;
}

export interface WorkingHour {
  days: string;
  hours: string;
}

export interface ContactInfo {
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHours: WorkingHour[];
}

export interface SiteStats {
  yearsOfTradition: string;
  carnivalsLived: string;
  costumesRented: string;
  happyHearts: string;
}

export type CostumeCategory = Costume['category'];
export type CatalogCategory = 'Todos' | CostumeCategory;

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface AdminDesigner {
  id: string;
  name: string;
}

export interface AdminCostume {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  category_name?: string;
  description: string;
  designer_id: string | null;
  designer_name?: string | null;
  rental_price: number;
  sale_price: number | null;
  is_available: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  primary_image?: string | null;
}

export interface AdminCostumeImage {
  id: string;
  costume_id: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
}

export interface AdminCostumePayload {
  slug: string;
  name: string;
  category_id: string;
  description: string;
  designer_id: string | null;
  rental_price: number;
  sale_price: number | null;
  is_available: boolean;
  featured: boolean;
}

export interface AdminNamedOption {
  id: string;
  name: string;
}

export interface AdminCostumeDetail {
  id: string;
  detail: string;
  sort_order: number;
}

export interface AdminCostumeRelations {
  details: AdminCostumeDetail[];
  fabricIds: string[];
  accessoryIds: string[];
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
}

export interface AdminSiteStats {
  years_of_tradition: string;
  carnivals_lived: string;
  costumes_rented: string;
  happy_hearts: string;
}

export interface AdminContactInfo {
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export interface AdminWorkingHour {
  id: string;
  days: string;
  hours: string;
  sort_order: number;
}

export interface AdminSiteAsset {
  key: string;
  storage_path: string;
}
