'use client';

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Progress,
  Stack,
  Text,
  useToast,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Card from 'components/card/Card';
import { TimelinePlannerService } from 'services/TimelinePlannerService';
import { useRouter } from 'next/navigation';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  duration: number;
  dependencies: string[];
  materials: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  start_date?: string;
  end_date?: string;
}

interface Timeline {
  id: string;
  project_id: string;
  phases: ProjectPhase[];
  start_date: string;
  estimated_end_date: string;
  actual_end_date?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'delayed';
  weather_delays: number;
  current_phase_id: string;
}

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    // Initially check if we have a project ID in localStorage or get the first available project
    const checkProject = async () => {
      try {
        const storedProjectId = localStorage.getItem('selectedProjectId');
        if (storedProjectId) {
          setSelectedProjectId(storedProjectId);
          await fetchTimeline(storedProjectId);
        } else {
          // Get first project from projects list
          const response = await fetch('/api/projects/list');
          const { data: projects } = await response.json();
          if (projects && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
            await fetchTimeline(projects[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking project:', error);
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    checkProject();
  }, []);

  const fetchTimeline = async (projectId: string) => {
    try {
      const response = await fetch(`/api/timeline/current?project_id=${projectId}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTimeline(data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timeline data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'gray',
      in_progress: 'blue',
      completed: 'green',
      delayed: 'red',
      planning: 'purple',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const calculateProgress = (phases: ProjectPhase[]) => {
    if (!phases.length) return 0;
    const completed = phases.filter(
      (phase) => phase.status === 'completed'
    ).length;
    return (completed / phases.length) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={5}>
        <Text>Loading timeline...</Text>
      </Container>
    );
  }

  if (!selectedProjectId) {
    return (
      <Container maxW="container.xl" py={5}>
        <Card>
          <Stack align="center" spacing={4} py={10}>
            <Text>Please create a project first to view its timeline.</Text>
            <Button colorScheme="blue" onClick={() => router.push('/admin/projects/new')}>
              Create New Project
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (!timeline) {
    return (
      <Container maxW="container.xl" py={5}>
        <Card>
          <Stack align="center" spacing={4} py={10}>
            <Text>No timeline available.</Text>
            <Button colorScheme="blue">Create Timeline</Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={5}>
      <Card mb={6}>
        <Stack spacing={4}>
          <Flex justify="space-between" align="center">
            <Heading size="md">Project Timeline</Heading>
            <Badge colorScheme={getStatusColor(timeline.status)}>
              {timeline.status.toUpperCase()}
            </Badge>
          </Flex>

          <Box>
            <Text mb={2}>Overall Progress</Text>
            <Progress
              value={calculateProgress(timeline.phases)}
              colorScheme="blue"
              size="sm"
              borderRadius="full"
            />
          </Box>

          <Flex justify="space-between" wrap="wrap" gap={4}>
            <Stack>
              <Text fontWeight="bold">Start Date</Text>
              <Text>{formatDate(timeline.start_date)}</Text>
            </Stack>
            <Stack>
              <Text fontWeight="bold">Estimated End Date</Text>
              <Text>{formatDate(timeline.estimated_end_date)}</Text>
            </Stack>
            <Stack>
              <Text fontWeight="bold">Weather Delays</Text>
              <Text>{timeline.weather_delays} days</Text>
            </Stack>
          </Flex>
        </Stack>
      </Card>

      <Stack spacing={4}>
        {timeline.phases.map((phase, index) => (
          <Card key={phase.id}>
            <Stack spacing={4}>
              <Flex justify="space-between" align="center">
                <Stack>
                  <Heading size="sm">{phase.name}</Heading>
                  <Text color="gray.600">{phase.description}</Text>
                </Stack>
                <Badge colorScheme={getStatusColor(phase.status)}>
                  {phase.status.toUpperCase()}
                </Badge>
              </Flex>

              <Divider />

              <Flex justify="space-between" wrap="wrap" gap={4}>
                <Text>Duration: {phase.duration} days</Text>
                {phase.start_date && (
                  <Text>Start: {formatDate(phase.start_date)}</Text>
                )}
                {phase.end_date && <Text>End: {formatDate(phase.end_date)}</Text>}
              </Flex>

              {phase.dependencies.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Dependencies
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    {phase.dependencies.map((depId) => (
                      <Badge key={depId} variant="outline">
                        Phase {timeline.phases.findIndex((p) => p.id === depId) + 1}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}

              <Flex justify="flex-end" gap={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  isDisabled={phase.status === 'completed'}
                >
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  isDisabled={phase.status === 'completed'}
                >
                  Report Delay
                </Button>
              </Flex>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
} 