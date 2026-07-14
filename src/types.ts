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
