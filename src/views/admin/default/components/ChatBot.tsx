import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    text: 'Hello! I\'m your construction assistant. I can help you with material selection, cost-saving tips, and general construction guidance. How can I help you today?',
    isBot: true,
    timestamp: new Date()
  }
];

// Mock responses based on keywords
const BOT_RESPONSES: { [key: string]: string } = {
  'material': 'For material selection, consider factors like durability, cost, and local availability. Premium materials often lead to better long-term value despite higher initial costs.',
  'cost': 'To reduce costs, you can: 1) Compare multiple supplier quotes, 2) Buy materials in bulk, 3) Consider alternative materials, 4) Plan purchases during off-peak seasons.',
  'quality': 'Quality in construction depends on: 1) Material grade selection, 2) Proper construction techniques, 3) Experienced labor, 4) Regular quality checks during construction.',
  'time': 'Construction timeline depends on house size, complexity, and weather conditions. A typical house takes 4-6 months. Plan for potential delays due to weather or material availability.',
  'foundation': 'Foundation is crucial for structural integrity. Key factors: 1) Soil type, 2) Local climate, 3) Building load, 4) Drainage requirements.',
  'roof': 'Roofing choices affect both aesthetics and functionality. Consider: 1) Local climate, 2) Maintenance requirements, 3) Energy efficiency, 4) Cost vs. longevity.',
};

export default function ChatBot() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bgColor = useColorModeValue('white', 'navy.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate bot response based on keywords
    setTimeout(() => {
      const lowercaseInput = input.toLowerCase();
      let botResponse = 'I apologize, but I\'m not sure about that. Please try asking about materials, costs, quality, timelines, foundation, or roofing.';

      for (const [keyword, response] of Object.entries(BOT_RESPONSES)) {
        if (lowercaseInput.includes(keyword)) {
          botResponse = response;
          break;
        }
      }

      const botMessage: Message = {
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <>
      <IconButton
        aria-label="Open chat"
        icon={<FaRobot />}
        position="fixed"
        bottom="20px"
        right="20px"
        colorScheme="blue"
        borderRadius="full"
        size="lg"
        onClick={onOpen}
      />

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Construction Assistant</DrawerHeader>

          <DrawerBody>
            <VStack h="full" spacing={4}>
              <Box flex="1" w="full" overflowY="auto" pb={4}>
                <VStack spacing={4} align="stretch">
                  {messages.map((message, index) => (
                    <Box
                      key={index}
                      alignSelf={message.isBot ? 'flex-start' : 'flex-end'}
                      bg={message.isBot ? 'blue.500' : 'gray.200'}
                      color={message.isBot ? 'white' : 'black'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      maxW="80%"
                    >
                      <Text>{message.text}</Text>
                      <Text fontSize="xs" color={message.isBot ? 'white' : 'gray.500'} mt={1}>
                        {message.timestamp.toLocaleTimeString()}
                      </Text>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              <HStack w="full">
                <Input
                  placeholder="Ask about materials, costs, quality..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  aria-label="Send message"
                  icon={<FaPaperPlane />}
                  colorScheme="blue"
                  onClick={handleSendMessage}
                />
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
} 