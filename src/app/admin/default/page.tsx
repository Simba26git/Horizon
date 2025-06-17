'use client';
/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Lewis Construction UI - v1.1.0
=========================================================

* Product Page: https://www.lewisconstruction-ui.com/
* Copyright 2022 Lewis Construction UI (https://www.lewisconstruction-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Heading,
  useColorModeValue,
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  useToast,
} from '@chakra-ui/react';
// Custom components
// import MiniCalendar from 'components/calendar/MiniCalendar';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
} from 'react-icons/md';
import CheckTable from 'views/admin/default/components/CheckTable';
import ComplexTable from 'views/admin/default/components/ComplexTable';
import DailyTraffic from 'views/admin/default/components/DailyTraffic';
import PieCard from 'views/admin/default/components/PieCard';
import { useState } from 'react';
import { calculateMaterials, calculateTotalCost, HouseSpecs, MaterialQuotation, Supplier } from 'services/MaterialService';
import { generateQuotationPDF } from 'views/admin/default/components/QuotationPDF';
import { supplierPriceService } from 'services/SupplierPriceService';
import ChatBot from 'views/admin/default/components/ChatBot';
import { notificationService, Currency } from 'services/NotificationService';

export default function QuotationSystem() {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardBg = useColorModeValue('white', 'navy.700');
  const toast = useToast();

  const [specs, setSpecs] = useState<HouseSpecs>({
    houseType: '',
    roofingType: '',
    bedrooms: 3,
    bathrooms: 2,
    floorArea: 120,
    location: '',
    quality: 'standard',
    terrain: 'flat'
  });

  const [quotations, setQuotations] = useState<MaterialQuotation[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSupplierComparison, setShowSupplierComparison] = useState(false);
  const [supplierComparisons, setSupplierComparisons] = useState<Array<{supplier: Supplier, price: number}>>([]);
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
      quotationNumber
    };

    generateQuotationPDF(data);

    // Send email if provided
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
      // Get comparisons for the first material as an example
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
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Currency Selection */}
      <Card p="20px" bg={cardBg} mb={4}>
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
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px" mb="20px">
        {/* House Specifications Form */}
        <Card p="20px" bg={cardBg}>
          <VStack spacing={4} align="stretch">
            <Heading size="md" color={textColor} mb={4}>
              House Specifications
            </Heading>
            
            <FormControl isRequired>
              <FormLabel>House Type</FormLabel>
              <Select
                placeholder="Select house type"
                value={specs.houseType}
                onChange={(e) => setSpecs({ ...specs, houseType: e.target.value })}
              >
                <option value="bungalow">Bungalow</option>
                <option value="twostorey">Two-Storey</option>
                <option value="apartment">Apartment Unit</option>
                <option value="villa">Villa</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
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

            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel>Number of Bedrooms</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={specs.bedrooms}
                  onChange={(value) => setSpecs({ ...specs, bedrooms: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Number of Bathrooms</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={specs.bathrooms}
                  onChange={(value) => setSpecs({ ...specs, bathrooms: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Total Floor Area (sq. meters)</FormLabel>
              <NumberInput
                min={50}
                max={1000}
                value={specs.floorArea}
                onChange={(value) => setSpecs({ ...specs, floorArea: parseInt(value) })}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Location</FormLabel>
              <Select
                placeholder="Select location"
                value={specs.location}
                onChange={(e) => setSpecs({ ...specs, location: e.target.value })}
              >
                <option value="urban">Urban Area</option>
                <option value="suburban">Suburban Area</option>
                <option value="rural">Rural Area</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Quality Level</FormLabel>
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
              <FormLabel>Terrain Type</FormLabel>
              <Select
                value={specs.terrain}
                onChange={(e) => setSpecs({ ...specs, terrain: e.target.value as 'flat' | 'sloped' | 'rocky' })}
              >
                <option value="flat">Flat</option>
                <option value="sloped">Sloped</option>
                <option value="rocky">Rocky</option>
              </Select>
            </FormControl>

            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleGenerateQuotation}
              isLoading={isLoading}
            >
              Generate Quotation
            </Button>
          </VStack>
        </Card>

        {/* Materials and Pricing */}
        <Card p="20px" bg={cardBg} overflowX="auto">
          <VStack spacing={4} align="stretch" width="100%">
            <Heading size="md" color={textColor} mb={4}>
              Materials and Pricing
            </Heading>
            
            <Box overflowX="auto" width="100%">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="25%">Material</Th>
                    <Th width="30%">Specifications</Th>
                    <Th width="20%">Supplier</Th>
                    <Th width="12%">Quantity</Th>
                    <Th width="13%" isNumeric>Price</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {quotations.map((quote, index) => (
                    <Tr key={index}>
                      <Td maxW="150px" isTruncated>{quote.material.name}</Td>
                      <Td maxW="200px">
                        {quote.material.specifications && (
                          <VStack align="start" spacing={1}>
                            {Object.entries(quote.material.specifications).map(([key, value]) => (
                              <Text key={key} fontSize="xs" isTruncated>
                                {key}: {value}
                              </Text>
                            ))}
                          </VStack>
                        )}
                      </Td>
                      <Td maxW="150px" isTruncated>{quote.material.supplier.name}</Td>
                      <Td fontSize="sm">{quote.quantity} {quote.material.unit}</Td>
                      <Td isNumeric fontSize="sm">{formatPrice(quote.totalPrice)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <HStack justify="space-between" pt={4} width="100%">
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
                isDisabled={quotations.length === 0}
              >
                {userEmail ? 'Download & Email Quotation' : 'Download Quotation'}
              </Button>
              <Button
                colorScheme="blue"
                flex={1}
                onClick={handleCompareSuppliers}
                isDisabled={quotations.length === 0}
                isLoading={isLoading}
              >
                Compare Suppliers
              </Button>
            </HStack>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* Supplier Comparison */}
      {showSupplierComparison && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px">
          {supplierComparisons.map((comparison, index) => (
            <Card key={index} p="20px" bg={cardBg}>
              <VStack align="stretch">
                <Heading size="sm" color={textColor} mb={2}>
                  {comparison.supplier.name}
                </Heading>
                <Text>Rating: {'⭐'.repeat(comparison.supplier.rating)}</Text>
                <Text>Location: {comparison.supplier.location}</Text>
                <Text>Delivery: {comparison.supplier.deliveryTime}</Text>
                <Text fontWeight="bold" mt={2}>
                  Price: {formatPrice(comparison.price)}
                </Text>
              </VStack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Add ChatBot */}
      <ChatBot />
    </Box>
  );
}
