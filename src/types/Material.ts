export interface Material {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  supplier: Supplier;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing';
  specifications?: {
    grade?: string;
    dimensions?: string;
    brand?: string;
    weight?: string;
    type?: string;
    size?: string;
    finish?: string;
    capacity?: string;
    diameter?: string;
    length?: string;
    gauge?: string;
    amperage?: string;
    material?: string;
    source?: string;
    color?: string;
    coverage?: string;
    pressure?: string;
    rating?: string;
    standard?: string;
    strength?: string;
  };
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  location: string;
  deliveryTime: string;
}

export interface SupplierPerformance {
  supplierId: string;
  onTimeDeliveryRate: number;
  qualityRating: number;
  priceCompetitiveness: number;
  responseTime: number;
  overallScore: number;
}

export interface PriceComparison {
  materialId: string;
  materialName: string;
  suppliers: {
    supplierId: string;
    supplierName: string;
    price: number;
    currency: string;
    lastUpdated: string;
  }[];
}
