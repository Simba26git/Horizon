'use client';

import {
  Box,
  Button,
  Container,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Card from 'components/card/Card';
import { Material, Supplier } from 'services/MaterialService';
import { supplierPriceService } from 'services/SupplierPriceService';

export default function MaterialsAndSuppliers() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, these would be API calls to your backend
        const materialsData = await fetch('/api/materials').then(res => res.json());
        const suppliersData = await fetch('/api/suppliers').then(res => res.json());
        setMaterials(materialsData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const MaterialsTable = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Category</Th>
          <Th>Unit</Th>
          <Th>Price Range</Th>
          <Th>Actions</Th>
        </Tr>
      </Thead>
      <Tbody>
        {materials.map((material) => (
          <Tr key={material.id}>
            <Td>{material.name}</Td>
            <Td>
              <Badge colorScheme={getCategoryColor(material.category)}>
                {material.category}
              </Badge>
            </Td>
            <Td>{material.unit}</Td>
            <Td>{`$${material.pricePerUnit}`}</Td>
            <Td>
              <Button size="sm" colorScheme="blue" mr={2}>
                Edit
              </Button>
              <Button size="sm" colorScheme="red">
                Delete
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const SuppliersTable = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Rating</Th>
          <Th>Location</Th>
          <Th>Delivery Time</Th>
          <Th>Actions</Th>
        </Tr>
      </Thead>
      <Tbody>
        {suppliers.map((supplier) => (
          <Tr key={supplier.id}>
            <Td>{supplier.name}</Td>
            <Td>{supplier.rating} / 5</Td>
            <Td>{supplier.location}</Td>
            <Td>{supplier.deliveryTime}</Td>
            <Td>
              <Button size="sm" colorScheme="blue" mr={2}>
                Edit
              </Button>
              <Button size="sm" colorScheme="red">
                Delete
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      structural: 'blue',
      finishing: 'green',
      electrical: 'yellow',
      plumbing: 'purple'
    };
    return colors[category] || 'gray';
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Card>
        <Tabs>
          <TabList>
            <Tab>Materials</Tab>
            <Tab>Suppliers</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Flex justify="space-between" mb={4}>
                <Text fontSize="xl" fontWeight="bold">
                  Materials List
                </Text>
                <Button colorScheme="blue">Add Material</Button>
              </Flex>
              {loading ? (
                <Text>Loading materials...</Text>
              ) : (
                <MaterialsTable />
              )}
            </TabPanel>

            <TabPanel>
              <Flex justify="space-between" mb={4}>
                <Text fontSize="xl" fontWeight="bold">
                  Suppliers List
                </Text>
                <Button colorScheme="blue">Add Supplier</Button>
              </Flex>
              {loading ? (
                <Text>Loading suppliers...</Text>
              ) : (
                <SuppliersTable />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Container>
  );
} 