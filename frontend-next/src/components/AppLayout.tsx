'use client';

import AppSidebar from '@/components/sidebar/AppSidebar';
import AppHeader from '@/components/AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

const AppLayout = ({ children, title, breadcrumb }: AppLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader title={title} breadcrumb={breadcrumb} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
