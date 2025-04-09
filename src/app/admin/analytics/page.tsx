'use client';

import {
  Box,
  SimpleGrid,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { quotationHistoryService } from '../../../services/QuotationHistoryService';
import { pricePredictionService } from '../../../services/PricePredictionService';
import { SupplierService } from '../../../services/SupplierService';
import { MaterialInventoryService } from '../../../services/MaterialInventoryService';
import { authService } from '../../../services/AuthService';
import { ApexOptions } from 'apexcharts';
import { useToast } from '@chakra-ui/react';

// Dynamically import charts to avoid SSR issues
const LineChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const BarChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const PieChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface QuotationStats {
  totalQuotations: number;
  averageAmount: number;
  quotationsByMonth: { month: string; count: number }[];
}

interface MaterialTrend {
  materialId: string;
  materialName: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface SupplierPerformance extends Supplier {
  supplier_id: string;
  on_time_delivery_rate: number;
  quality_rating: number;
  price_competitiveness: number;
  response_time: number;
  overall_score: number;
}

export default function Analytics(): JSX.Element {
  const [timeRange, setTimeRange] = useState('6');
  const [quotationStats, setQuotationStats] = useState<QuotationStats | null>(null);
  const [materialTrends, setMaterialTrends] = useState<MaterialTrend[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'navy.700');
  const textColor = useColorModeValue('navy.700', 'white');
  const supplierService = new SupplierService();
  const materialService = new MaterialInventoryService();
  const toast = useToast();

  useEffect(() => {
    const initUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
      } else {
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to view analytics',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [timeRange, userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch quotation statistics
      const stats = await quotationHistoryService.getQuotationStats(userId);
      setQuotationStats(stats);

      // Fetch materials and their trends
      const materials = await materialService.getMaterials();
      const trends = await Promise.all(
        materials.slice(0, 5).map(async (material) => {
          const trend = await pricePredictionService.getPriceTrend(material.id);
          const currentPrice = await materialService.getMaterialPriceHistory(material.id, 1);
          const latestPrice = currentPrice[0]?.price || 0;
          
          return {
            materialId: material.id,
            materialName: material.name,
            currentPrice: latestPrice,
            predictedPrice: latestPrice * (1 + (trend.percentage / 100)),
            trend: trend.trend === 'up' ? 'increasing' : trend.trend === 'down' ? 'decreasing' : 'stable',
            percentageChange: trend.percentage
          } as MaterialTrend;
        })
      );
      setMaterialTrends(trends);

      // Fetch supplier performance
      const suppliers = await supplierService.getSuppliers();
      const performance = await Promise.all(
        suppliers.map(async (supplier) => {
          const perf = await supplierService.getSupplierPerformance(supplier.id);
          return {
            ...supplier,
            ...perf,
            supplier_id: supplier.id
          } as SupplierPerformance;
        })
      );
      setSupplierPerformance(performance);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quotationChartOptions: ApexOptions = {
    chart: {
      type: 'line' as const,
      toolbar: { show: false }
    },
    xaxis: {
      categories: quotationStats?.quotationsByMonth.map(q => q.month) || []
    },
    stroke: { curve: 'smooth' },
    theme: { mode: useColorModeValue('light', 'dark') }
  };

  const quotationChartSeries = [{
    name: 'Quotations',
    data: quotationStats?.quotationsByMonth.map(q => q.count) || []
  }];

  const materialTrendOptions: ApexOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: { horizontal: true }
    },
    theme: { mode: useColorModeValue('light', 'dark') }
  };

  const materialTrendSeries = [{
    name: 'Price Change %',
    data: materialTrends.map(m => m.percentageChange)
  }];

  const supplierPieOptions: ApexOptions = {
    chart: {
      type: 'pie' as const,
    },
    labels: supplierPerformance.map(s => s.name),
    theme: { mode: useColorModeValue('light', 'dark') }
  };

  const supplierPieSeries = supplierPerformance.map(s => s.overall_score);

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing='20px' mb='20px'>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total Quotations</StatLabel>
              <StatNumber>{quotationStats?.totalQuotations || 0}</StatNumber>
              <StatHelpText>
                <StatArrow type='increase' />
                23.36%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Average Amount</StatLabel>
              <StatNumber>
                ${quotationStats?.averageAmount.toFixed(2) || '0.00'}
              </StatNumber>
              <StatHelpText>
                <StatArrow type='increase' />
                12.5%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Active Suppliers</StatLabel>
              <StatNumber>{supplierPerformance.length}</StatNumber>
              <StatHelpText>
                <StatArrow type='increase' />
                8.2%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing='20px' mb='20px'>
        <Card bg={cardBg}>
          <CardHeader>
            <Flex justify='space-between' align='center'>
              <Heading size='md' color={textColor}>Quotation Trends</Heading>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                width='100px'
              >
                <option value='3'>3 Months</option>
                <option value='6'>6 Months</option>
                <option value='12'>12 Months</option>
              </Select>
            </Flex>
          </CardHeader>
          <CardBody>
            <Box h='300px'>
              <LineChart
                options={quotationChartOptions}
                series={quotationChartSeries}
                type='line'
                height='100%'
              />
            </Box>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size='md' color={textColor}>Material Price Trends</Heading>
          </CardHeader>
          <CardBody>
            <Box h='300px'>
              <BarChart
                options={materialTrendOptions}
                series={materialTrendSeries}
                type='bar'
                height='100%'
              />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing='20px'>
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size='md' color={textColor}>Supplier Performance</Heading>
          </CardHeader>
          <CardBody>
            <Box h='300px'>
              <PieChart
                options={supplierPieOptions}
                series={supplierPieSeries}
                type='pie'
                height='100%'
              />
            </Box>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size='md' color={textColor}>Price Predictions</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4}>
              {materialTrends.map((trend, index) => (
                <Stat key={index}>
                  <StatLabel>{trend.materialName}</StatLabel>
                  <StatNumber>${trend.currentPrice.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    <StatArrow 
                      type={trend.trend === 'increasing' ? 'increase' : 'decrease'} 
                    />
                    {Math.abs(trend.percentageChange).toFixed(1)}%
                  </StatHelpText>
                </Stat>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
} 