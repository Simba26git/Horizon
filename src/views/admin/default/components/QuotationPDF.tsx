import { jsPDF } from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import { Material } from 'services/MaterialService';
import { Currency } from 'services/NotificationService';

interface MaterialQuote {
  material: string;
  supplier: string;
  quantity: string;
  price: number;
  specifications?: {
    grade?: string;
    dimensions?: string;
    brand?: string;
  };
}

interface QuotationData {
  houseType: string;
  roofingType: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  location: string;
  quality?: 'standard' | 'premium' | 'luxury';
  terrain?: 'flat' | 'sloped' | 'rocky';
  materials: MaterialQuote[];
  totalCost: number;
  laborCost?: number;
  equipmentCost?: number;
  overhead?: number;
  currency: Currency;
  quotationNumber: string;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}

const formatCurrency = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
};

const addLogo = (doc: jsPDF) => {
  // In a real app, you would add your company logo here
  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185);
  doc.text('HORIZON', 20, 20);
  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.text('CONSTRUCTION', 20, 28);
};

const addHeader = (doc: jsPDF, quotationNumber: string) => {
  const date = new Date().toLocaleDateString();
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Quotation #: ${quotationNumber}`, 140, 20);
  doc.text(`Date: ${date}`, 140, 28);
  doc.text('Valid for: 30 days', 140, 36);
};

export const generateQuotationPDF = (data: QuotationData) => {
  const doc = new jsPDF();
  
  // Add logo and header
  addLogo(doc);
  addHeader(doc, data.quotationNumber);
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text('Construction Quotation', 105, 50, { align: 'center' });
  
  // Add house specifications
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('House Specifications', 20, 70);
  
  doc.setFontSize(10);
  const specs = [
    [`House Type: ${data.houseType}`, `Quality Level: ${data.quality || 'Standard'}`],
    [`Roofing Type: ${data.roofingType}`, `Terrain Type: ${data.terrain || 'Flat'}`],
    [`Bedrooms: ${data.bedrooms}`, `Bathrooms: ${data.bathrooms}`],
    [`Total Floor Area: ${data.floorArea} sq. meters`, `Location: ${data.location}`]
  ];
  
  let y = 80;
  specs.forEach(row => {
    doc.text(row[0], 20, y);
    doc.text(row[1], 120, y);
    y += 8;
  });
  
  // Add materials table
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('Materials and Pricing', 20, y + 10);
  
  const tableColumn = ['Material', 'Specifications', 'Supplier', 'Quantity', 'Unit Price', 'Total'];
  const tableRows = data.materials.map(item => [
    item.material,
    item.specifications ? 
      Object.entries(item.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') : 
      '',
    item.supplier,
    item.quantity,
    formatCurrency(item.price / parseFloat(item.quantity.split(' ')[0]), data.currency),
    formatCurrency(item.price, data.currency)
  ]);

  (doc as any).autoTable({
    startY: y + 15,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 }
    }
  });

  // Add cost breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  
  const costs = [
    ['Materials Subtotal:', formatCurrency(data.totalCost * 0.6, data.currency)],
    ['Labor Cost:', formatCurrency(data.laborCost || data.totalCost * 0.25, data.currency)],
    ['Equipment Cost:', formatCurrency(data.equipmentCost || data.totalCost * 0.1, data.currency)],
    ['Overhead & Profit:', formatCurrency(data.overhead || data.totalCost * 0.05, data.currency)],
    ['Total Estimated Cost:', formatCurrency(data.totalCost, data.currency)]
  ];
  
  let costY = finalY;
  costs.forEach((cost, index) => {
    const isTotal = index === costs.length - 1;
    if (isTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      costY += 5;
    }
    doc.text(cost[0], 100, costY);
    doc.text(cost[1], 190, costY, { align: 'right' });
    costY += 8;
  });
  
  // Add footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  const footerY = costY + 10;
  
  const footer = [
    'Note:',
    '1. This is an estimated quotation. Actual prices may vary based on market conditions.',
    '2. Material prices are subject to change without prior notice.',
    '3. Delivery costs are not included unless specifically mentioned.',
    '4. This quotation is valid for 30 days from the date of issue.',
    '5. Payment terms: 50% down payment, balance upon completion.',
    '',
    'For questions or clarifications, please contact us:',
    'Phone: (555) 123-4567',
    'Email: sales@horizonconstruction.com'
  ];
  
  footer.forEach((line, index) => {
    doc.text(line, 20, footerY + (index * 4));
  });
  
  // Save the PDF
  doc.save(`construction-quotation-${data.quotationNumber}.pdf`);
};

export default generateQuotationPDF; 