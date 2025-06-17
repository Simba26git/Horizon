import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdPerson,
  MdLock,
  MdAttachMoney,
  MdBuildCircle,
  MdShoppingCart,
  MdTimeline,
  MdWarning,
  MdAnalytics,
  MdGroup,
} from 'react-icons/md';
import { IRoute } from 'types/navigation';

const routes: IRoute[] = [
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Generate Quotation',
    layout: '/admin',
    path: '/quotation',
    icon: <Icon as={MdAttachMoney} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Materials & Suppliers',
    layout: '/admin',
    path: '/materials',
    icon: <Icon as={MdShoppingCart} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Group Buying',
    layout: '/admin',
    path: '/group-buying',
    icon: <Icon as={MdGroup} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Construction Timeline',
    layout: '/admin',
    path: '/timeline',
    icon: <Icon as={MdTimeline} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Price Alerts',
    layout: '/admin',
    path: '/alerts',
    icon: <Icon as={MdWarning} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Analytics',
    layout: '/admin',
    path: '/analytics',
    icon: <Icon as={MdAnalytics} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Contractors',
    layout: '/admin',
    path: '/contractors',
    icon: <Icon as={MdBuildCircle} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
  },
];

export default routes;
