'use client';

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { authService } from '../../../services/AuthService';

export default function SignUp() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorDetails = useColorModeValue('navy.700', 'secondaryGray.600');
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error } = await authService.signUp(email, password);
      
      if (error) throw error;

      if (user) {
        // Update profile with additional information
        await authService.updateProfile(user.id, {
          company_name: companyName,
          contact_number: contactNumber
        });

        toast({
          title: 'Account created.',
          description: "We've created your account for you.",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        router.push('/auth/sign-in');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during sign up.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      maxW={{ base: "100%", md: "max-content" }}
      w='100%'
      mx="auto"
      h='100vh'
      alignItems='center'
      justifyContent='center'
      px={{ base: "25px", md: "0px" }}
      flexDirection='column'>
      <Box me='auto' ms='auto' mb='60px'>
        <Heading color={textColor} fontSize='36px' mb='10px'>
          Sign Up
        </Heading>
        <Text
          mb='36px'
          ms='4px'
          color={textColorSecondary}
          fontWeight='400'
          fontSize='md'>
          Enter your details to create an account!
        </Text>
      </Box>
      <Flex
        zIndex='2'
        direction='column'
        w={{ base: "100%", md: "420px" }}
        maxW='100%'
        background='transparent'
        borderRadius='15px'
        mx={{ base: "auto", lg: "unset" }}
        me='auto'
        mb={{ base: "20px", md: "auto" }}>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <FormControl>
            <FormLabel
              display='flex'
              ms='4px'
              fontSize='sm'
              fontWeight='500'
              color={textColor}
              mb='8px'>
              Email<Text color={brandStars}>*</Text>
            </FormLabel>
            <Input
              isRequired={true}
              variant='auth'
              fontSize='sm'
              ms={{ base: "0px", md: "0px" }}
              type='email'
              placeholder='mail@horizon.com'
              mb='24px'
              fontWeight='500'
              size='lg'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormLabel
              ms='4px'
              fontSize='sm'
              fontWeight='500'
              color={textColor}
              display='flex'>
              Password<Text color={brandStars}>*</Text>
            </FormLabel>
            <InputGroup size='md'>
              <Input
                isRequired={true}
                fontSize='sm'
                placeholder='Min. 8 characters'
                mb='24px'
                size='lg'
                type={show ? "text" : "password"}
                variant='auth'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputRightElement display='flex' alignItems='center' mt='4px'>
                <Icon
                  color={textColorSecondary}
                  _hover={{ cursor: "pointer" }}
                  as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                  onClick={() => setShow(!show)}
                />
              </InputRightElement>
            </InputGroup>
            <FormLabel
              ms='4px'
              fontSize='sm'
              fontWeight='500'
              color={textColor}
              display='flex'>
              Company Name
            </FormLabel>
            <Input
              fontSize='sm'
              placeholder='Your company name'
              mb='24px'
              size='lg'
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <FormLabel
              ms='4px'
              fontSize='sm'
              fontWeight='500'
              color={textColor}
              display='flex'>
              Contact Number
            </FormLabel>
            <Input
              fontSize='sm'
              placeholder='Your contact number'
              mb='24px'
              size='lg'
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
            <Button
              fontSize='sm'
              variant='brand'
              fontWeight='500'
              w='100%'
              h='50'
              mb='24px'
              type='submit'
              isLoading={isLoading}>
              Create Account
            </Button>
          </FormControl>
        </form>
        <Flex
          flexDirection='column'
          justifyContent='center'
          alignItems='start'
          maxW='100%'
          mt='0px'>
          <Text color={textColorDetails} fontWeight='400' fontSize='14px'>
            Already have an account?
            <Link href='/auth/sign-in'>
              <Text
                color={textColorBrand}
                as='span'
                ms='5px'
                fontWeight='500'>
                Sign In
              </Text>
            </Link>
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
} 