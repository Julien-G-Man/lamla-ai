import React from 'react';
import { faChartBar, faUsers, faFileAlt, faCog, faComments, faTrophy, faUser, faBolt } from '@fortawesome/free-solid-svg-icons';
import AppShell from './AppShell';

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', icon: faChartBar, path: '/admin-dashboard/overview' },
  { label: 'Users', icon: faUsers, path: '/admin-dashboard/users' },
  { label: 'Content', icon: faFileAlt, path: '/admin-dashboard/content' },
  { label: 'Activity', icon: faComments, path: '/admin-dashboard/activity' },
  { label: 'Ratings', icon: faTrophy, path: '/admin-dashboard/ratings' },
  { label: 'Clashes', icon: faBolt, path: '/admin-dashboard/clashes' },
  { label: 'Settings', icon: faCog, path: '/admin-dashboard/settings' },
  { label: 'Profile', icon: faUser, path: '/profile' },
];

const MOBILE_ITEMS = ADMIN_NAV_ITEMS.filter(({ path }) => path !== '/profile');

export default function AdminAppShell({ children }) {
  return (
    <AppShell
      variant="user"
      sidebarVariant="admin"
      sidebarNavItems={ADMIN_NAV_ITEMS.map((item) => (
        item.path === '/profile' ? { ...item, path: '/admin-dashboard/profile' } : item
      ))}
      mobileNavItems={MOBILE_ITEMS.map((item) => (
        item.path === '/profile' ? { ...item, path: '/admin-dashboard/profile' } : item
      ))}
    >
      {children}
    </AppShell>
  );
}
