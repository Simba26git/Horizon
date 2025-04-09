'use client';

import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
  HStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState } from 'react';
import Card from 'components/card/Card';
import { MaterialQuotation, getSuppliers, getMaterialsBySupplier, calculateTotalCost, calculateMaterials } from 'services/MaterialService';
import type { HouseSpecs, Supplier, Material } from 'services/MaterialService';
import { notificationService, Currency } from 'services/NotificationService';
import { generateQuotationPDF } from 'views/admin/default/components/QuotationPDF';
import { supplierPriceService } from 'services/SupplierPriceService';

export default function QuotationPage() {
  const toast = useToast();
  const [specs, setSpecs] = useState<HouseSpecs>({
    houseType: '',
    roofingType: '',
    bedrooms: 0,
    bathrooms: 0,
    floorArea: 0,
    location: '',
    quality: 'standard',
    terrain: 'flat'
  });

  const [quotations, setQuotations] = useState<MaterialQuotation[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSupplierComparison, setShowSupplierComparison] = useState(false);
  const [supplierComparisons, setSupplierComparisons] = useState<Array<{
    supplier: Supplier;
    price: number;
  }>>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [userEmail, setUserEmail] = useState('');

  const handleGenerateQuotation = async () => {
    if (!specs.houseType || !specs.roofingType || !specs.location) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const materialQuotations = calculateMaterials(specs);
      const total = calculateTotalCost(materialQuotations);
      
      setQuotations(materialQuotations);
      setTotalCost(total);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate quotation. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const calculateRequiredQuantity = (material: Material, specs: HouseSpecs): number => {
    // This is a simplified calculation - in a real implementation, this would be more sophisticated
    const baseArea = specs.floorArea;
    const qualityFactor = specs.quality === 'premium' ? 1.2 : specs.quality === 'luxury' ? 1.5 : 1;
    
    switch (material.category) {
      case 'structural':
        return Math.ceil(baseArea * 2 * qualityFactor);
      case 'finishing':
        return Math.ceil(baseArea * 1.5 * qualityFactor);
      case 'electrical':
        return Math.ceil(baseArea * 0.5 * qualityFactor);
      case 'plumbing':
        return Math.ceil(baseArea * 0.3 * qualityFactor);
      default:
        return 0;
    }
  };

  const handleDownloadQuotation = async () => {
    if (quotations.length === 0) {
      toast({
        title: 'No Quotation',
        description: 'Please generate a quotation first.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const quotationNumber = `QT${Date.now().toString().slice(-6)}`;
    const data = {
      ...specs,
      materials: quotations.map(q => ({
        material: q.material.name,
        supplier: q.material.supplier.name,
        quantity: `${q.quantity} ${q.material.unit}`,
        price: notificationService.convertCurrency(q.totalPrice, 'USD', selectedCurrency),
        specifications: q.material.specifications
      })),
      totalCost: notificationService.convertCurrency(totalCost, 'USD', selectedCurrency),
      laborCost: notificationService.convertCurrency(totalCost * 0.25, 'USD', selectedCurrency),
      equipmentCost: notificationService.convertCurrency(totalCost * 0.1, 'USD', selectedCurrency),
      overhead: notificationService.convertCurrency(totalCost * 0.05, 'USD', selectedCurrency),
      currency: selectedCurrency,
      quotationNumber,
      terrain: specs.terrain as 'flat' | 'sloped' | 'rocky'
    };

    generateQuotationPDF(data);

    if (userEmail) {
      const emailSent = await notificationService.sendQuotationEmail(userEmail, data);
      if (emailSent) {
        toast({
          title: 'Email Sent',
          description: 'Quotation has been sent to your email.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleCompareSuppliers = async () => {
    setIsLoading(true);
    try {
      if (quotations.length > 0) {
        const comparisons = await supplierPriceService.compareSupplierPrices(quotations[0].material.id);
        setSupplierComparisons(comparisons);
        setShowSupplierComparison(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch supplier comparisons.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const formatPrice = (amount: number): string => {
    return notificationService.formatCurrency(
      notificationService.convertCurrency(amount, 'USD', selectedCurrency),
      selectedCurrency
    );
  };

  return (
    <Container maxW="container.xl" pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Card>
        <Tabs>
          <TabList>
            <Tab>Specifications</Tab>
            <Tab>Materials</Tab>
            <Tab>Preview</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Stack spacing={6}>
                {/* Currency and Email Selection */}
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <FormControl>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                    >
                      {notificationService.getAvailableCurrencies().map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Email (optional)</FormLabel>
                    <Input
                      type="email"
                      placeholder="Enter your email to receive the quotation"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* House Specifications */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <FormControl>
                    <FormLabel>House Type</FormLabel>
                    <Select
                      placeholder="Select house type"
                      value={specs.houseType}
                      onChange={(e) => setSpecs({ ...specs, houseType: e.target.value })}
                    >
                      <option value="single_story">Single Story</option>
                      <option value="two_story">Two Story</option>
                      <option value="bungalow">Bungalow</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Roofing Type</FormLabel>
                    <Select
                      placeholder="Select roofing type"
                      value={specs.roofingType}
                      onChange={(e) => setSpecs({ ...specs, roofingType: e.target.value })}
                    >
                      <option value="metal">Metal Roofing</option>
                      <option value="tile">Clay Tiles</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Number of Bedrooms</FormLabel>
                    <NumberInput min={1}>
                      <NumberInputField
                        value={specs.bedrooms}
                        onChange={(e) => setSpecs({ ...specs, bedrooms: parseInt(e.target.value) })}
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Number of Bathrooms</FormLabel>
                    <NumberInput min={1}>
                      <NumberInputField
                        value={specs.bathrooms}
                        onChange={(e) => setSpecs({ ...specs, bathrooms: parseInt(e.target.value) })}
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Floor Area (sq ft)</FormLabel>
                    <NumberInput min={100}>
                      <NumberInputField
                        value={specs.floorArea}
                        onChange={(e) => setSpecs({ ...specs, floorArea: parseInt(e.target.value) })}
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Location</FormLabel>
                    <Input
                      placeholder="Enter location"
                      value={specs.location}
                      onChange={(e) => setSpecs({ ...specs, location: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Quality</FormLabel>
                    <Select
                      value={specs.quality}
                      onChange={(e) => setSpecs({ ...specs, quality: e.target.value as any })}
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="luxury">Luxury</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Terrain</FormLabel>
                    <Select
                      value={specs.terrain}
                      onChange={(e) => setSpecs({ ...specs, terrain: e.target.value as any })}
                    >
                      <option value="flat">Flat</option>
                      <option value="sloped">Sloped</option>
                      <option value="rocky">Rocky</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Button colorScheme="blue" onClick={handleGenerateQuotation} isLoading={isLoading}>
                  Generate Quotation
                </Button>
              </Stack>
            </TabPanel>

            <TabPanel>
              {quotations.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {quotations.map((q, index) => (
                    <Card key={index} p={4}>
                      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                        <Text fontWeight="bold">{q.material.name}</Text>
                        <Text>{q.quantity} {q.material.unit}</Text>
                        <Text>{q.material.supplier.name}</Text>
                        <Text>{formatPrice(q.totalPrice)}</Text>
                      </Grid>
                    </Card>
                  ))}
                  
                  <HStack justify="space-between" pt={4}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Cost Breakdown:</Text>
                      <Text fontSize="sm">Materials: {formatPrice(totalCost * 0.6)}</Text>
                      <Text fontSize="sm">Labor: {formatPrice(totalCost * 0.25)}</Text>
                      <Text fontSize="sm">Equipment: {formatPrice(totalCost * 0.1)}</Text>
                      <Text fontSize="sm">Overhead: {formatPrice(totalCost * 0.05)}</Text>
                    </VStack>
                    <VStack align="end">
                      <Text fontWeight="bold">Total Estimate:</Text>
                      <Text fontSize="xl" fontWeight="bold">{formatPrice(totalCost)}</Text>
                    </VStack>
                  </HStack>

                  <HStack spacing={4}>
                    <Button
                      colorScheme="green"
                      flex={1}
                      onClick={handleDownloadQuotation}
                    >
                      {userEmail ? 'Download & Email Quotation' : 'Download Quotation'}
                    </Button>
                    <Button
                      colorScheme="blue"
                      flex={1}
                      onClick={handleCompareSuppliers}
                      isLoading={isLoading}
                    >
                      Compare Suppliers
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Text>Generate a quotation to view materials</Text>
              )}
            </TabPanel>

            <TabPanel>
              {showSupplierComparison && (
                <VStack spacing={4} align="stretch">
                  <Text fontSize="xl" fontWeight="bold">Supplier Comparison</Text>
                  {supplierComparisons.map((comparison, index) => (
                    <Card key={index} p={4}>
                      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                        <Text fontWeight="bold">{comparison.supplier.name}</Text>
                        <Text>{comparison.supplier.rating}/5</Text>
                        <Text>{formatPrice(comparison.price)}</Text>
                      </Grid>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Container>
  );
} 