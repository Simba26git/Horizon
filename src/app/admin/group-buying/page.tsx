'use client';

import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Progress,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Card from 'components/card/Card';
import { GroupBuyingService } from 'services/GroupBuyingService';

interface GroupBuyingOpportunity {
  id: string;
  material_id: string;
  target_quantity: number;
  current_quantity: number;
  price_per_unit: number;
  minimum_participants: number;
  current_participants: number;
  expiry_date: string;
  status: 'open' | 'closed' | 'fulfilled';
}

export default function GroupBuying() {
  const [opportunities, setOpportunities] = useState<GroupBuyingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/group-buying/opportunities');
      const data = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group buying opportunities',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (opportunityId: string) => {
    try {
      await fetch(`/api/group-buying/join/${opportunityId}`, {
        method: 'POST',
      });
      toast({
        title: 'Success',
        description: 'Successfully joined the group buying opportunity',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchOpportunities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join the opportunity',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return (current / target) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'green',
      closed: 'red',
      fulfilled: 'blue',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Group Buying Opportunities</Heading>
        <Button colorScheme="blue">Create New Opportunity</Button>
      </Flex>

      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold">
                  Material ID: {opportunity.material_id}
                </Text>
                <Text
                  color={getStatusColor(opportunity.status)}
                  fontWeight="semibold"
                >
                  {opportunity.status.toUpperCase()}
                </Text>
              </Flex>

              <Box>
                <Text mb={2}>Progress</Text>
                <Progress
                  value={calculateProgress(
                    opportunity.current_quantity,
                    opportunity.target_quantity
                  )}
                  colorScheme="blue"
                  size="sm"
                  borderRadius="full"
                />
                <Flex justify="space-between" mt={1}>
                  <Text fontSize="sm">
                    {opportunity.current_quantity} / {opportunity.target_quantity}{' '}
                    units
                  </Text>
                  <Text fontSize="sm">
                    {opportunity.current_participants} /{' '}
                    {opportunity.minimum_participants} participants
                  </Text>
                </Flex>
              </Box>

              <Stack spacing={1}>
                <Text>
                  Price per unit: ${opportunity.price_per_unit.toFixed(2)}
                </Text>
                <Text>Expires: {formatDate(opportunity.expiry_date)}</Text>
              </Stack>

              <Button
                colorScheme="blue"
                isDisabled={opportunity.status !== 'open'}
                onClick={() => handleJoin(opportunity.id)}
              >
                Join Group Buy
              </Button>
            </Stack>
          </Card>
        ))}
      </Grid>

      {loading && (
        <Flex justify="center" mt={10}>
          <Text>Loading opportunities...</Text>
        </Flex>
      )}

      {!loading && opportunities.length === 0 && (
        <Card>
          <Stack align="center" spacing={4} py={10}>
            <Text>No active group buying opportunities available.</Text>
            <Button colorScheme="blue">Create New Opportunity</Button>
          </Stack>
        </Card>
      )}
    </Container>
  );
} 