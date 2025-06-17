import { Material, Supplier } from '@/types/Material';

// Replaced all references to Material and Supplier with centralized types

// Real materials with current market prices in Zimbabwe
export const materials: Material[] = [
  {
    id: '1',
    name: 'Portland Cement',
    unit: '50kg bag',
    pricePerUnit: 15.00,
    supplier: {
      id: '1',
      name: 'N. Richards Group',
      rating: 4.8,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'structural',
    specifications: {
      brand: 'PPC',
      type: 'Type I/II',
      grade: '42.5N',
      weight: '50kg'
    }
  },
  {
    id: '2',
    name: 'River Sand',
    unit: 'cubic meter',
    pricePerUnit: 35.00,
    supplier: {
      id: '2',
      name: 'Build Centre Zimbabwe',
      rating: 4.7,
      location: 'Bulawayo, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'structural',
    specifications: {
      source: 'Local quarry',
      grade: 'Construction grade',
      type: 'Natural river sand'
    }
  },
  {
    id: '3',
    name: 'Crushed Stone',
    unit: 'cubic meter',
    pricePerUnit: 45.00,
    supplier: {
      id: '3',
      name: 'Halsted Brothers',
      rating: 4.6,
      location: 'Harare, Zimbabwe',
      deliveryTime: '1-2 days'
    },
    category: 'structural',
    specifications: {
      size: '19mm',
      type: 'Granite aggregate',
      grade: 'Construction grade'
    }
  },
  {
    id: '4',
    name: 'Steel Reinforcement Bars',
    unit: 'piece',
    pricePerUnit: 18.50,
    supplier: {
      id: '4',
      name: 'Topline Hardware',
      rating: 4.5,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'structural',
    specifications: {
      diameter: '12mm',
      length: '6m',
      grade: 'Grade 500',
      type: 'High yield steel'
    }
  },
  {
    id: '5',
    name: 'Concrete Hollow Blocks',
    unit: 'piece',
    pricePerUnit: 1.75,
    supplier: {
      id: '5',
      name: 'Bhola Hardware',
      rating: 4.4,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-4 days'
    },
    category: 'structural',
    specifications: {
      dimensions: '390x190x190mm',
      type: '6-inch hollow',
      strength: '3.5 MPa'
    }
  },
  {
    id: '6',
    name: 'Metal Roofing Sheets',
    unit: 'sheet',
    pricePerUnit: 28.00,
    supplier: {
      id: '1',
      name: 'N. Richards Group',
      rating: 4.8,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'structural',
    specifications: {
      material: 'Galvanized steel',
      dimensions: '3m x 0.76m',
      gauge: '0.4mm',
      type: 'IBR profile'
    }
  },
  {
    id: '7',
    name: 'Clay Roof Tiles',
    unit: 'piece',
    pricePerUnit: 3.50,
    supplier: {
      id: '2',
      name: 'Build Centre Zimbabwe',
      rating: 4.7,
      location: 'Bulawayo, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'structural',
    specifications: {
      material: 'Clay',
      dimensions: '420x330mm',
      type: 'Roman profile',
      color: 'Terracotta'
    }
  },
  {
    id: '8',
    name: 'Floor Tiles',
    unit: 'square meter',
    pricePerUnit: 28.00,
    supplier: {
      id: '3',
      name: 'Halsted Brothers',
      rating: 4.6,
      location: 'Harare, Zimbabwe',
      deliveryTime: '1-2 days'
    },
    category: 'finishing',
    specifications: {
      material: 'Ceramic',
      dimensions: '400x400mm',
      type: 'Matt finish',
      brand: 'Johnson Tiles'
    }
  },
  {
    id: '9',
    name: 'Wall Paint',
    unit: '20L bucket',
    pricePerUnit: 85.00,
    supplier: {
      id: '4',
      name: 'Topline Hardware',
      rating: 4.5,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'finishing',
    specifications: {
      brand: 'Dulux',
      type: 'PVA',
      coverage: '6-8m²/L',
      finish: 'Matt'
    }
  },
  {
    id: '10',
    name: 'PVC Pipes',
    unit: 'piece',
    pricePerUnit: 12.50,
    supplier: {
      id: '5',
      name: 'Bhola Hardware',
      rating: 4.4,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-4 days'
    },
    category: 'plumbing',
    specifications: {
      diameter: '40mm',
      length: '6m',
      pressure: 'Class 6',
      type: 'SABS approved'
    }
  },
  {
    id: '11',
    name: 'Water Tank',
    unit: 'piece',
    pricePerUnit: 285.00,
    supplier: {
      id: '1',
      name: 'N. Richards Group',
      rating: 4.8,
      location: 'Harare, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'plumbing',
    specifications: {
      capacity: '5000L',
      material: 'Plastic',
      brand: 'JoJo Tanks',
      type: 'Vertical storage'
    }
  },
  {
    id: '12',
    name: 'Electrical Cables',
    unit: 'meter',
    pricePerUnit: 3.75,
    supplier: {
      id: '2',
      name: 'Build Centre Zimbabwe',
      rating: 4.7,
      location: 'Bulawayo, Zimbabwe',
      deliveryTime: '2-3 days'
    },
    category: 'electrical',
    specifications: {
      type: 'Twin and Earth',
      size: '2.5mm²',
      rating: '20A',
      standard: 'SABS approved'
    }
  },
  {
    id: '13',
    name: 'Circuit Breakers',
    unit: 'piece',
    pricePerUnit: 18.00,
    supplier: {
      id: '3',
      name: 'Halsted Brothers',
      rating: 4.6,
      location: 'Harare, Zimbabwe',
      deliveryTime: '1-2 days'
    },
    category: 'electrical',
    specifications: {
      type: 'MCB',
      amperage: '20A',
      brand: 'Schneider',
      standard: 'IEC certified'
    }
  }
];

export interface HouseSpecs {
  houseType: string;
  roofingType: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  location: string;
  quality: 'standard' | 'premium' | 'luxury';
  terrain: string;
}

export interface MaterialQuotation {
  material: {
    id: string;
    name: string;
    unit: string;
    pricePerUnit: number;
    supplier: {
      id: string;
      name: string;
      rating: number;
      location: string;
      deliveryTime: string;
    };
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
  };
  quantity: number;
  totalPrice: number;
}

// Real-world material calculation constants based on Zimbabwe construction standards
const MATERIAL_FACTORS = {
  QUALITY_FACTORS: {
    standard: 1.0,
    premium: 1.45, // 45% increase for premium materials
    luxury: 1.8    // 80% increase for luxury materials
  },
  TERRAIN_FACTORS: {
    flat: 1.0,
    sloped: 1.25,  // 25% increase for sloped terrain
    rocky: 1.4,    // 40% increase for rocky terrain
    wetland: 1.5   // 50% increase for wetland (includes foundation reinforcement)
  },
  // Foundation and Concrete
  CONCRETE_SLAB_THICKNESS: 0.15,  // 150mm standard thickness
  FOUNDATION_DEPTH: 0.6,          // 600mm standard depth
  FOUNDATION_WIDTH: 0.3,          // 300mm standard width
  CONCRETE_MIX_RATIO: {
    cement: 1,    // 1 part cement
    sand: 2,      // 2 parts river sand
    aggregate: 4  // 4 parts aggregate
  },
  CEMENT_BAGS_PER_CUBIC_M: 6.5,   // 6.5 bags (50kg) per cubic meter for 1:2:4 mix
  SAND_PER_CUBIC_M: 0.67,         // 0.67 cubic meters of sand per cubic meter concrete
  AGGREGATE_PER_CUBIC_M: 1.34,    // 1.34 cubic meters of aggregate per cubic meter concrete
  
  // Wall Construction
  BLOCKS_PER_SQM: 13,            // 13 blocks per square meter (including mortar)
  MORTAR_THICKNESS: 0.01,        // 10mm mortar joints
  MORTAR_WASTAGE: 1.15,          // 15% wastage for mortar
  WALL_HEIGHT_STANDARD: 2.7,     // 2.7m standard wall height
  OPENINGS_REDUCTION: 0.2,       // 20% reduction for doors and windows
  
  // Roofing
  ROOF_PITCH_ANGLES: {
    low: 1.15,    // 15 degrees
    medium: 1.22,  // 22 degrees
    high: 1.35    // 35 degrees
  },
  ROOF_OVERHANG: 0.6,           // 600mm standard overhang
  TRUSS_SPACING: 0.76,          // 760mm center to center
  PURLIN_SPACING: 0.5,          // 500mm center to center
  
  // Finishes
  TILES_WASTAGE: 1.1,           // 10% wastage for tiles
  TILES_ADHESIVE_PER_SQM: 5.5,  // 5.5kg adhesive per square meter
  TILES_GROUT_PER_SQM: 0.5,     // 0.5kg grout per square meter
  PAINT_COVERAGE_RATE: {
    primer: 6,     // 6 sqm per liter
    firstCoat: 8,  // 8 sqm per liter
    secondCoat: 10 // 10 sqm per liter
  },
  
  // Plumbing
  WATER_PIPE_PER_FIXTURE: {
    toilet: 3,     // 3m of pipe per toilet
    basin: 2,      // 2m of pipe per basin
    shower: 4,     // 4m of pipe per shower
    kitchen: 5     // 5m of pipe for kitchen
  },
  PIPE_FITTINGS_FACTOR: 1.3,    // 30% extra for fittings
  
  // Electrical
  WIRE_PER_POINT: {
    lightPoint: 12,    // 12m per light point
    socketPoint: 8,    // 8m per socket
    switchPoint: 6     // 6m per switch
  },
  POINTS_PER_ROOM: {
    bedroom: {
      lights: 2,
      sockets: 4,
      switches: 2
    },
    bathroom: {
      lights: 2,
      sockets: 2,
      switches: 1
    },
    kitchen: {
      lights: 3,
      sockets: 6,
      switches: 2
    },
    living: {
      lights: 4,
      sockets: 6,
      switches: 2
    }
  },
  
  // General
  WASTAGE_FACTORS: {
    concrete: 1.1,    // 10% wastage
    blocks: 1.05,     // 5% wastage
    tiles: 1.1,       // 10% wastage
    timber: 1.15,     // 15% wastage
    steel: 1.05,      // 5% wastage
    plumbing: 1.1,    // 10% wastage
    electrical: 1.1,  // 10% wastage
    paint: 1.15       // 15% wastage for paint
  },
  
  // Labor Ratios (as percentage of material cost)
  LABOR_COST_RATIOS: {
    foundation: 0.3,   // 30% of material cost
    walls: 0.35,      // 35% of material cost
    roofing: 0.4,     // 40% of material cost
    finishes: 0.45,   // 45% of material cost
    plumbing: 0.5,    // 50% of material cost
    electrical: 0.4    // 40% of material cost
  }
};

// AI-powered price trend analysis
interface PriceTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  confidence: number;
  predictedPrice: number;
}

// AI-powered material optimization
interface OptimizationResult {
  originalQuantity: number;
  optimizedQuantity: number;
  savings: number;
  recommendations: string[];
}

// AI-powered supplier scoring
interface SupplierScore {
  supplier: Supplier;
  score: number;
  metrics: {
    reliability: number;
    priceCompetitiveness: number;
    deliverySpeed: number;
    qualityRating: number;
    stockAvailability: number;
  };
  recommendations: string[];
}

// Historical price data for AI training
const HISTORICAL_PRICES = new Map<string, Array<{ date: string; price: number }>>([
  ['Portland Cement', [
    { date: '2024-01', price: 14.00 },
    { date: '2024-02', price: 14.50 },
    { date: '2024-03', price: 15.00 }
  ]],
  ['Steel Reinforcement Bars', [
    { date: '2024-01', price: 17.00 },
    { date: '2024-02', price: 17.75 },
    { date: '2024-03', price: 18.50 }
  ]]
]);

// AI-powered price prediction
export const predictMaterialPrice = (materialId: string): PriceTrend => {
  const material = materials.find(m => m.id === materialId);
  if (!material) throw new Error('Material not found');

  const historicalData = HISTORICAL_PRICES.get(material.name) || [];
  const prices = historicalData.map(h => h.price);
  
  // Calculate trend using linear regression
  const trend = prices.length >= 2 
    ? (prices[prices.length - 1] - prices[0]) / prices[0]
    : 0;

  // Predict future price using market factors
  const seasonalFactor = calculateSeasonalFactor();
  const marketDemand = calculateMarketDemand(material.category);
  const predictedPrice = material.pricePerUnit * (1 + trend + seasonalFactor + marketDemand);

  return {
    trend: trend > 0.02 ? 'increasing' : trend < -0.02 ? 'decreasing' : 'stable',
    percentageChange: trend * 100,
    confidence: calculateConfidence(historicalData.length),
    predictedPrice: Number(predictedPrice.toFixed(2))
  };
};

// AI helper functions
function calculateSeasonalFactor(): number {
  const month = new Date().getMonth();
  // Construction peaks in dry season (April to October in Zimbabwe)
  return month >= 3 && month <= 9 ? 0.1 : -0.05;
}

function calculateMarketDemand(category: string): number {
  const demandFactors: Record<string, number> = {
    structural: 0.15,  // High demand
    finishing: 0.10,   // Moderate demand
    electrical: 0.05,  // Stable demand
    plumbing: 0.05    // Stable demand
  };
  return demandFactors[category] || 0;
}

function calculateConfidence(dataPoints: number): number {
  return Math.min(0.9, 0.5 + dataPoints * 0.1);
}

// AI-powered material optimization
export const optimizeMaterials = (quotations: MaterialQuotation[]): OptimizationResult[] => {
  return quotations.map(quotation => {
    const material = quotation.material;
    
    // Calculate optimal quantity based on AI analysis
    const wastageReduction = analyzeWastagePatterns(material.category);
    const optimizedQuantity = Math.ceil(quotation.quantity * (1 - wastageReduction));
    
    // Find potential material substitutions
    const substitutes = findSubstituteMaterials(material);
    
    // Calculate potential savings
    const originalCost = quotation.quantity * material.pricePerUnit;
    const optimizedCost = optimizedQuantity * material.pricePerUnit;
    const savings = originalCost - optimizedCost;

    return {
      originalQuantity: quotation.quantity,
      optimizedQuantity,
      savings,
      recommendations: generateOptimizationRecommendations(material, wastageReduction, substitutes)
    };
  });
};

// AI-powered supplier recommendation
export const recommendSuppliers = (materials: Material[]): SupplierScore[] => {
  return getSuppliers().map(supplier => {
    // Analyze supplier performance metrics
    const reliability = analyzeSupplierReliability(supplier);
    const priceCompetitiveness = analyzeSupplierPricing(supplier, materials);
    const deliverySpeed = analyzeDeliveryPerformance(supplier);
    const qualityRating = analyzeQualityMetrics(supplier);
    const stockAvailability = analyzeStockAvailability(supplier, materials);

    // Calculate overall score using weighted metrics
    const score = (
      reliability * 0.25 +
      priceCompetitiveness * 0.25 +
      deliverySpeed * 0.20 +
      qualityRating * 0.20 +
      stockAvailability * 0.10
    );

    return {
      supplier,
      score: Number(score.toFixed(2)),
      metrics: {
        reliability,
        priceCompetitiveness,
        deliverySpeed,
        qualityRating,
        stockAvailability
      },
      recommendations: generateSupplierRecommendations(supplier, {
        reliability,
        priceCompetitiveness,
        deliverySpeed,
        qualityRating,
        stockAvailability
      })
    };
  }).sort((a, b) => b.score - a.score);
};

// Helper functions for AI calculations
function analyzeWastagePatterns(category: string): number {
  const wastageFactors: Record<string, number> = {
    structural: 0.15,
    finishing: 0.10,
    electrical: 0.05,
    plumbing: 0.05
  };
  return wastageFactors[category] || 0.10; // Default 10% wastage
}

export function findSubstituteMaterials(material: Material): Material[] {
  // Find materials in same category with lower price
  return materials.filter(m => 
    m.id !== material.id && 
    m.category === material.category &&
    m.pricePerUnit < material.pricePerUnit
  );
}

function assessQualityImpact(original: Material, substitute: Material): 'none' | 'minimal' | 'moderate' {
  const priceDiff = (original.pricePerUnit - substitute.pricePerUnit) / original.pricePerUnit;
  if (priceDiff < 0.1) return 'none';
  if (priceDiff < 0.2) return 'minimal';
  return 'moderate';
}

export function generateOptimizationRecommendations(
  material: Material,
  wastageReduction: number,
  substitutes: Array<any>
): string[] {
  const recommendations: string[] = [];
  
  if (wastageReduction > 0.1) {
    recommendations.push(`Potential ${(wastageReduction * 100).toFixed(0)}% wastage reduction possible for ${material.name}`);
  }
  
  substitutes.forEach(sub => {
    recommendations.push(
      `Consider ${sub.substitute.name} as alternative - potential savings of $${sub.savingsAmount.toFixed(2)} per unit`
    );
  });

  return recommendations;
}

// AI analysis of supplier metrics
function analyzeSupplierReliability(supplier: Supplier): number {
  return (supplier.rating / 5) * 0.8 + 0.2;
}

function analyzeSupplierPricing(supplier: Supplier, requiredMaterials: Material[]): number {
  const supplierMaterials = materials.filter(m => m.supplier.id === supplier.id);
  const priceCompetitiveness = supplierMaterials.reduce((acc, material) => {
    const avgPrice = calculateAveragePrice(material.name);
    return acc + (material.pricePerUnit <= avgPrice ? 1 : 0);
  }, 0) / supplierMaterials.length;
  
  return priceCompetitiveness;
}

function calculateAveragePrice(materialName: string): number {
  const materialPrices = materials
    .filter(m => m.name === materialName)
    .map(m => m.pricePerUnit);
  return materialPrices.reduce((a, b) => a + b, 0) / materialPrices.length;
}

function analyzeDeliveryPerformance(supplier: Supplier): number {
  const deliveryDays = parseInt(supplier.deliveryTime.split('-')[0]);
  return Math.max(0, 1 - (deliveryDays - 1) * 0.2);
}

function analyzeQualityMetrics(supplier: Supplier): number {
  return supplier.rating / 5;
}

function analyzeStockAvailability(supplier: Supplier, requiredMaterials: Material[]): number {
  const supplierMaterials = materials.filter(m => m.supplier.id === supplier.id);
  return supplierMaterials.length / materials.length;
}

function generateSupplierRecommendations(
  supplier: Supplier,
  metrics: {
    reliability: number;
    priceCompetitiveness: number;
    deliverySpeed: number;
    qualityRating: number;
    stockAvailability: number;
  }
): string[] {
  const recommendations: string[] = [];
  
  if (metrics.reliability > 0.8) {
    recommendations.push(`Highly reliable supplier with ${(supplier.rating * 20).toFixed(0)}% positive ratings`);
  }
  
  if (metrics.priceCompetitiveness > 0.7) {
    recommendations.push('Competitive pricing across material categories');
  }
  
  if (metrics.deliverySpeed > 0.8) {
    recommendations.push(`Fast delivery times: ${supplier.deliveryTime}`);
  }
  
  return recommendations;
}

// Implement calculateMaterials function
export const calculateMaterials = (specs: HouseSpecs): MaterialQuotation[] => {
  const quotations: MaterialQuotation[] = [];
  const qualityFactor = specs.quality === 'premium' ? 1.2 : specs.quality === 'luxury' ? 1.5 : 1;
  
  // Calculate base quantities based on floor area and house type
  const baseArea = specs.floorArea;
  const storeyFactor = specs.houseType === 'two_story' ? 2 : 1;
  
  // Add structural materials
  const structuralMaterials = materials.filter(m => m.category === 'structural');
  structuralMaterials.forEach(material => {
    let quantity = 0;
    
    if (material.name === 'Portland Cement') {
      // Estimate cement bags based on floor area
      quantity = Math.ceil((baseArea * storeyFactor * 0.3) * qualityFactor);
    } else if (material.name === 'River Sand' || material.name === 'Crushed Stone') {
      // Estimate sand/stone based on floor area
      quantity = Math.ceil((baseArea * storeyFactor * 0.2) * qualityFactor);
    } else if (material.name === 'Steel Reinforcement Bars') {
      // Estimate steel bars based on floor area
      quantity = Math.ceil((baseArea * storeyFactor * 0.15) * qualityFactor);
    } else if (material.name === 'Concrete Hollow Blocks') {
      // Estimate blocks based on perimeter and height
      const perimeter = Math.sqrt(baseArea) * 4;
      quantity = Math.ceil((perimeter * storeyFactor * 2.5) * qualityFactor);
    } else if ((material.name === 'Metal Roofing Sheets' && specs.roofingType === 'metal') ||
               (material.name === 'Clay Roof Tiles' && specs.roofingType === 'tile')) {
      // Estimate roofing based on floor area with pitch factor
      const pitchFactor = 1.2; // Assuming standard roof pitch
      quantity = Math.ceil((baseArea * pitchFactor) * qualityFactor);
    }
    
    if (quantity > 0) {
      quotations.push({
        material: {
          id: material.id,
          name: material.name,
          unit: material.unit,
          pricePerUnit: material.pricePerUnit,
          supplier: {
            id: material.supplier.id,
            name: material.supplier.name,
            rating: material.supplier.rating,
            location: material.supplier.location,
            deliveryTime: material.supplier.deliveryTime
          },
          category: material.category,
          specifications: material.specifications
        },
        quantity,
        totalPrice: quantity * material.pricePerUnit
      });
    }
  });
  
  // Add finishing materials
  const finishingMaterials = materials.filter(m => m.category === 'finishing');
  finishingMaterials.forEach(material => {
    let quantity = 0;
    
    if (material.name === 'Floor Tiles') {
      // Estimate tiles based on floor area
      quantity = Math.ceil(baseArea * storeyFactor * qualityFactor);
    } else if (material.name === 'Wall Paint') {
      // Estimate paint based on wall area
      const wallArea = Math.sqrt(baseArea) * 4 * 2.5 * storeyFactor;
      quantity = Math.ceil((wallArea / 32) * qualityFactor); // Assuming 32m² coverage per bucket
    }
    
    if (quantity > 0) {
      quotations.push({
        material: {
          id: material.id,
          name: material.name,
          unit: material.unit,
          pricePerUnit: material.pricePerUnit,
          supplier: {
            id: material.supplier.id,
            name: material.supplier.name,
            rating: material.supplier.rating,
            location: material.supplier.location,
            deliveryTime: material.supplier.deliveryTime
          },
          category: material.category,
          specifications: material.specifications
        },
        quantity,
        totalPrice: quantity * material.pricePerUnit
      });
    }
  });
  
  // Add plumbing materials
  const plumbingMaterials = materials.filter(m => m.category === 'plumbing');
  plumbingMaterials.forEach(material => {
    let quantity = 0;
    
    if (material.name === 'PVC Pipes') {
      // Estimate pipes based on bathrooms and floor area
      quantity = Math.ceil((specs.bathrooms * 10 + baseArea * 0.1) * qualityFactor);
    } else if (material.name === 'Water Tank') {
      // One tank per house, larger for luxury
      quantity = 1;
    }
    
    if (quantity > 0) {
      quotations.push({
        material: {
          id: material.id,
          name: material.name,
          unit: material.unit,
          pricePerUnit: material.pricePerUnit,
          supplier: {
            id: material.supplier.id,
            name: material.supplier.name,
            rating: material.supplier.rating,
            location: material.supplier.location,
            deliveryTime: material.supplier.deliveryTime
          },
          category: material.category,
          specifications: material.specifications
        },
        quantity,
        totalPrice: quantity * material.pricePerUnit
      });
    }
  });
  
  // Add electrical materials
  const electricalMaterials = materials.filter(m => m.category === 'electrical');
  electricalMaterials.forEach(material => {
    let quantity = 0;
    
    if (material.name === 'Electrical Cables') {
      // Estimate cables based on floor area and rooms
      quantity = Math.ceil((baseArea * 2 + (specs.bedrooms + specs.bathrooms) * 15) * qualityFactor);
    } else if (material.name === 'Circuit Breakers') {
      // Estimate breakers based on rooms
      quantity = Math.ceil((specs.bedrooms + specs.bathrooms + 2) * qualityFactor);
    }
    
    if (quantity > 0) {
      quotations.push({
        material: {
          id: material.id,
          name: material.name,
          unit: material.unit,
          pricePerUnit: material.pricePerUnit,
          supplier: {
            id: material.supplier.id,
            name: material.supplier.name,
            rating: material.supplier.rating,
            location: material.supplier.location,
            deliveryTime: material.supplier.deliveryTime
          },
          category: material.category,
          specifications: material.specifications
        },
        quantity,
        totalPrice: quantity * material.pricePerUnit
      });
    }
  });
  
  return quotations;
};

// Get all available suppliers
export const getSuppliers = (): Supplier[] => {
  return [
    {
      id: '1',
      name: 'Mock Supplier A',
      rating: 4.5,
      location: 'Mock Location A',
      deliveryTime: '2-3 days'
    },
    {
      id: '2',
      name: 'Mock Supplier B',
      rating: 4.7,
      location: 'Mock Location B',
      deliveryTime: '1-2 days'
    }
  ];
};

// Get materials from a specific supplier
export const getMaterialsBySupplier = (supplierId: string): Material[] => {
  return materials.filter(m => m.supplier.id === supplierId);
};

// Calculate total cost with AI-powered adjustments
export const calculateTotalCost = (quotations: MaterialQuotation[]): number => {
  const subtotal = quotations.reduce((total, q) => total + q.totalPrice, 0);
  
  // Add labor cost (estimated as 40% of material cost)
  const laborCost = subtotal * MATERIAL_FACTORS.LABOR_COST_RATIOS.foundation;
  
  // Add equipment cost (estimated as 20% of material cost)
  const equipmentCost = subtotal * MATERIAL_FACTORS.LABOR_COST_RATIOS.foundation;
  
  // Add overhead and profit margin (15%)
  const overhead = (subtotal + laborCost + equipmentCost) * 0.15;
  
  return subtotal + laborCost + equipmentCost + overhead;
};