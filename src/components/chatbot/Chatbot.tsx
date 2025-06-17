import React, { useState } from 'react';
import { Box, Input, Button, VStack, Text } from '@chakra-ui/react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    const botResponse: Message = {
      sender: 'bot',
      text: `You said: "${input}". How can I assist you further?`,
    };
    setMessages((prev) => [...prev, botResponse]);

    setInput('');
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} bg="white" shadow="md">
      <VStack spacing={4} align="stretch">
        <Box overflowY="auto" maxHeight="300px" borderWidth="1px" borderRadius="lg" p={2} bg="gray.50">
          {messages.map((message, index) => (
            <Text key={index} color={message.sender === 'user' ? 'blue.500' : 'green.500'}>
              {message.sender === 'user' ? 'You: ' : 'Bot: '}
              {message.text}
            </Text>
          ))}
        </Box>
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button colorScheme="blue" onClick={handleSend}>
          Send
        </Button>
      </VStack>
    </Box>
  );
};

export default Chatbot;
