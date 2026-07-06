import { useState } from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { NeuralHUD } from '@/pages/NeuralHUD';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { useStore } from '@/store';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const currentPage = useStore((s) => s.currentPage);

  const page = () => {
    switch (currentPage) {
      case 'hud': return <NeuralHUD />;
      case 'settings': return <SettingsPage />;
      case 'about': return <AboutPage />;
    }
  };

  return (
    <div className="flex h-dvh min-h-dvh w-full overflow-hidden bg-cyber-dark">
      <SidebarNav collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
          {page()}
        </main>
      </div>
      <NotificationCenter />
    </div>
  );
}
