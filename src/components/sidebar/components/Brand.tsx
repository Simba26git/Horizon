// Chakra imports
import { Flex, useColorModeValue, Text } from '@chakra-ui/react';

// Custom components
import { HSeparator } from 'components/separator/Separator';

export function SidebarBrand() {
	//   Chakra color mode
	let logoColor = useColorModeValue('navy.700', 'white');

	return (
		<Flex alignItems='center' flexDirection='column'>
			<Text fontSize='4xl' fontWeight='extrabold' color={logoColor} my='32px'>Lewis Construction</Text>
			<HSeparator mb='20px' />
		</Flex>
	);
}

export default SidebarBrand;
