import { extendTheme, HTMLChakraProps, ThemingProps } from '@chakra-ui/react';
import { CardComponent } from './additions/card/card';
import { buttonStyles } from './components/button';
import { badgeStyles } from './components/badge';
import { inputStyles } from './components/input';
import { progressStyles } from './components/progress';
import { sliderStyles } from './components/slider';
import { textareaStyles } from './components/textarea';
import { switchStyles } from './components/switch';
import { linkStyles } from './components/link';
import { globalStyles } from './styles';

const breakpoints = {
	sm: '30em',
	md: '48em',
	lg: '62em',
	xl: '80em',
	'2xl': '96em',
};

export default extendTheme(
	{ breakpoints }, // Breakpoints
	globalStyles,
	badgeStyles, // badge styles
	buttonStyles, // button styles
	linkStyles, // link styles
	progressStyles, // progress styles
	sliderStyles, // slider styles
	inputStyles, // input styles
	textareaStyles, // textarea styles
	switchStyles, // switch styles
	CardComponent // card component
);

export interface CustomCardProps extends HTMLChakraProps<'div'>, ThemingProps {}
