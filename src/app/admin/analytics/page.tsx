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
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import { quotationHistoryService } from '../../../services/QuotationHistoryService';
import { pricePredictionService } from '../../../services/PricePredictionService';
import { SupplierService } from '../../../services/SupplierService';
import { MaterialInventoryService } from '../../../services/MaterialInventoryService';
import { authService } from '../../../services/AuthService';
import { ApexOptions } from 'apexcharts';
import { useToast } from '@chakra-ui/react';
import { RealtimeClient } from '@supabase/realtime-js';
import { SidebarContext } from '../../../contexts/SidebarContext';
import Chatbot from '../../../components/chatbot/Chatbot';
import { AnalyticsService } from '@services/AnalyticsService';
import React from 'react';

const materials = [
  { id: '1', name: 'Steel', pricePerUnit: 100 },
  { id: '2', name: 'Concrete', pricePerUnit: 50 },
];

// Dynamically import charts to avoid SSR issues
const LineChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const BarChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const PieChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const PlotlyChart = dynamic(() => import('react-plotly.js'), { ssr: false });

const realtimeClient = new RealtimeClient(process.env.NEXT_PUBLIC_SUPABASE_URL);

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
  supplierId: string;
  onTimeDeliveryRate: number;
  qualityRating: number;
  priceCompetitiveness: number;
  responseTime: number;
  overallScore: number;
}

interface QuotationPayload {
  amount: number;
  month: string;
}

interface MaterialPayload {
  material_id: string;
  price: number;
}

interface SupplierPayload {
  supplier_id: string;
  on_time_delivery_rate: number;
  quality_rating: number;
  price_competitiveness: number;
  response_time: number;
  overall_score: number;
}

interface ClusterAnalysis {
  centeroid: [number, number];
}

export default function Analytics(): JSX.Element {
  const { loading, setLoading } = useContext(SidebarContext);
  const [timeRange, setTimeRange] = useState('6');
  const [quotationStats, setQuotationStats] = useState<QuotationStats | null>(null);
  const [materialTrends, setMaterialTrends] = useState<MaterialTrend[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [clusteringData, setClusteringData] = useState<ClusterAnalysis[]>([]);

  const cardBg = useColorModeValue('white', 'navy.700');
  const textColor = useColorModeValue('navy.700', 'white');
  const supplierService = new SupplierService();
  const materialService = new MaterialInventoryService();
  const toast = useToast();
  const analyticsService = new AnalyticsService();

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
            supplierId: supplier.id,
            onTimeDeliveryRate: perf.onTimeDeliveryRate,
            qualityRating: perf.qualityRating,
            priceCompetitiveness: perf.priceCompetitiveness,
            responseTime: perf.responseTime,
            overallScore: perf.overallScore,
            id: supplier.id,
            name: supplier.name,
            rating: supplier.rating,
            location: supplier.location,
            deliveryTime: supplier.deliveryTime,
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

  useEffect(() => {
    const mockQuotationStats = {
      totalQuotations: 120,
      averageAmount: 5000,
      quotationsByMonth: [
        { month: 'January', count: 10 },
        { month: 'February', count: 15 },
        { month: 'March', count: 20 },
        { month: 'April', count: 25 },
        { month: 'May', count: 30 },
        { month: 'June', count: 20 },
      ],
    };

    const mockMaterialTrends: MaterialTrend[] = [
      {
        materialId: '1',
        materialName: 'Steel',
        currentPrice: 100,
        predictedPrice: 110,
        trend: 'increasing',
        percentageChange: 10,
      },
      {
        materialId: '2',
        materialName: 'Concrete',
        currentPrice: 50,
        predictedPrice: 45,
        trend: 'decreasing',
        percentageChange: -10,
      },
    ];

    const mockSupplierPerformance = [
      {
        id: '1',
        supplierId: '1',
        name: 'Supplier A',
        onTimeDeliveryRate: 95,
        qualityRating: 4.5,
        priceCompetitiveness: 4,
        responseTime: 24,
        overallScore: 90,
      },
      {
        id: '2',
        supplierId: '2',
        name: 'Supplier B',
        onTimeDeliveryRate: 85,
        qualityRating: 4,
        priceCompetitiveness: 3.5,
        responseTime: 48,
        overallScore: 80,
      },
    ];

    setQuotationStats(mockQuotationStats);
    setMaterialTrends(mockMaterialTrends);
    setSupplierPerformance(mockSupplierPerformance);
  }, []);

  useEffect(() => {
    const analyticsService = new AnalyticsService();
    analyticsService.performClusterAnalysis(materials).then((data) => {
      setClusteringData(data.map((d) => ({ ...d, centeroid: [d.centeroid[0] || 0, d.centeroid[1] || 0] })));
    });
  }, []);

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

  const supplierPieSeries = supplierPerformance.map(s => s.overallScore);

  const clusteringLayout = {
    title: { text: 'Optimization Results' },
  };

  const optimizationResults: Array<{ material: string; optimalQuantity: number; costSavings: number }> = [
    {
      material: 'Steel',
      optimalQuantity: 100,
      costSavings: 500,
    },
    {
      material: 'Concrete',
      optimalQuantity: 200,
      costSavings: 300,
    },
  ];

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

      <Box>
        <Heading size="lg" mb={4} color={textColor}>Quotation Statistics</Heading>
        {quotationStats ? (
          <SimpleGrid columns={3} spacing={4}>
            <Stat>
              <StatLabel>Total Quotations</StatLabel>
              <StatNumber>{quotationStats.totalQuotations}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Average Amount</StatLabel>
              <StatNumber>${quotationStats.averageAmount.toFixed(2)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Quotations by Month</StatLabel>
              <StatHelpText>
                {quotationStats.quotationsByMonth.map((monthStat) => (
                  <Box key={monthStat.month}>{monthStat.month}: {monthStat.count}</Box>
                ))}
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4} color={textColor}>Material Trends</Heading>
        {materialTrends.length > 0 ? (
          <SimpleGrid columns={2} spacing={4}>
            {materialTrends.map((trend) => (
              <Card key={trend.materialId} bg={cardBg} p={4}>
                <CardHeader>
                  <Heading size="md" color={textColor}>{trend.materialName}</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Current Price: ${trend.currentPrice.toFixed(2)}</Text>
                  <Text>Predicted Price: ${trend.predictedPrice.toFixed(2)}</Text>
                  <Text>Trend: {trend.trend}</Text>
                  <Text>Change: {trend.percentageChange.toFixed(2)}%</Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4} color={textColor}>Supplier Performance</Heading>
        {supplierPerformance.length > 0 ? (
          <SimpleGrid columns={3} spacing={4}>
            {supplierPerformance.map((supplier) => (
              <Card key={supplier.supplierId} bg={cardBg} p={4}>
                <CardHeader>
                  <Heading size="md" color={textColor}>{supplier.name}</Heading>
                </CardHeader>
                <CardBody>
                  <Text>On-Time Delivery Rate: {supplier.onTimeDeliveryRate}%</Text>
                  <Text>Quality Rating: {supplier.qualityRating}/5</Text>
                  <Text>Price Competitiveness: {supplier.priceCompetitiveness}/5</Text>
                  <Text>Response Time: {supplier.responseTime} hours</Text>
                  <Text>Overall Score: {supplier.overallScore}/100</Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4} color={textColor}>Mock Quotation Trends</Heading>
        {quotationStats ? (
          <LineChart
            options={{
              chart: { id: 'quotation-trends' },
              xaxis: { categories: quotationStats.quotationsByMonth.map((monthStat) => monthStat.month) },
            }}
            series={[
              {
                name: 'Quotations',
                data: quotationStats.quotationsByMonth.map((monthStat) => monthStat.count),
              },
            ]}
          />
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4} color={textColor}>Mock Material Price Trends</Heading>
        {materialTrends.length > 0 ? (
          <LineChart
            options={{
              chart: { id: 'material-price-trends' },
              xaxis: { categories: materialTrends.map((trend) => trend.materialName) },
            }}
            series={[
              {
                name: 'Current Price',
                data: materialTrends.map((trend) => trend.currentPrice),
              },
              {
                name: 'Predicted Price',
                data: materialTrends.map((trend) => trend.predictedPrice),
              },
            ]}
          />
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box mt={8}>
        <Heading size="lg" mb={4} color={textColor}>Mock Supplier Performance</Heading>
        {supplierPerformance.length > 0 ? (
          <BarChart
            options={{
              chart: { id: 'supplier-performance' },
              xaxis: { categories: supplierPerformance.map((supplier) => supplier.name) },
            }}
            series={[
              {
                name: 'Overall Score',
                data: supplierPerformance.map((supplier) => supplier.overallScore),
              },
            ]}
          />
        ) : (
          <Text>Loading...</Text>
        )}
      </Box>

      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing='20px' mb='20px'>
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size='md'>Quotation Trends</Heading>
            </CardHeader>
            <CardBody>
              <PlotlyChart
                data={[
                  {
                    x: quotationStats?.quotationsByMonth.map(q => q.month) || [],
                    y: quotationStats?.quotationsByMonth.map(q => q.count) || [],
                    type: 'scatter',
                    mode: 'lines+markers',
                    marker: { color: 'blue' },
                  },
                ]}
                layout={{
                  title: { text: 'Quotation Trends' },
                  xaxis: { title: { text: 'Month' } },
                  yaxis: { title: { text: 'Count' } },
                }}
              />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size='md'>Material Price Trends</Heading>
            </CardHeader>
            <CardBody>
              <PlotlyChart
                data={[
                  {
                    x: materialTrends.map(m => m.materialName),
                    y: materialTrends.map(m => m.percentageChange),
                    type: 'bar',
                    marker: { color: 'orange' },
                  },
                ]}
                layout={{
                  title: { text: 'Material Price Trends' },
                  xaxis: { title: { text: 'Material' } },
                  yaxis: { title: { text: 'Price Change (%)' } },
                }}
              />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size='md'>Supplier Performance</Heading>
            </CardHeader>
            <CardBody>
              <PlotlyChart
                data={[
                  {
                    labels: supplierPerformance.map(s => s.name),
                    values: supplierPerformance.map(s => s.overallScore),
                    type: 'pie',
                  },
                ]}
                layout={{ title: { text: 'Supplier Performance' } }}
              />
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md" color={textColor}>Clustering Results</Heading>
          </CardHeader>
          <CardBody>
            <PlotlyChart
              data={[
                {
                  x: clusteringData.map((d: ClusterAnalysis) => d.centeroid[0]),
                  y: clusteringData.map((d: ClusterAnalysis) => d.centeroid[1]),
                  mode: 'markers',
                  marker: { size: 10 },
                  type: 'scatter',
                },
              ]}
              layout={clusteringLayout}
            />
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md" color={textColor}>Optimization Results</Heading>
          </CardHeader>
          <CardBody>
            {optimizationResults.map((result: { material: string; optimalQuantity: number; costSavings: number }, index: number) => (
              <Box key={index} mb={4}>
                <Text color={textColor}>
                  Material: {result.material}
                </Text>
                <Text color={textColor}>
                  Optimal Quantity: {result.optimalQuantity}
                </Text>
                <Text color={textColor}>
                  Cost Savings: ${result.costSavings}
                </Text>
              </Box>
            ))}
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box mt={8}>
        <Heading size="md" color={textColor} mb={4}>AI Chatbot</Heading>
        <Chatbot />
      </Box>
    </Box>
  );
}