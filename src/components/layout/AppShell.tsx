/**
 * AppShell — Main application layout
 *
 * Provides:
 * - Header (connection status, language toggle, navigation)
 * - Collapsible SidebarNav
 * - Main content area (React Router Outlet)
 * - Responsive design
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-dark">
      {/* Sidebar */}
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
