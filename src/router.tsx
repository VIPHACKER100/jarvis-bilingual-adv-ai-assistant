import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { NeuralHUD } from "./pages/NeuralHUD";
import { SettingsPage } from "./pages/SettingsPage";
import { SecurityDashboard } from "./pages/SecurityDashboard";
import { AuditTimeline } from "./pages/AuditTimeline";
import { DeviceSyncHub } from "./pages/DeviceSyncHub";
import { AutomationDashboard } from "./pages/AutomationDashboard";
import { FileManager } from "./pages/FileManager";
import { WindowManager } from "./pages/WindowManager";
import { WhatsAppControl } from "./pages/WhatsAppControl";
import { RemoteDesktop } from "./pages/RemoteDesktop";
import { InputSimulator } from "./pages/InputSimulator";
import { MediaTools } from "./pages/MediaTools";
import { NeuralTraining } from "./pages/NeuralTraining";
import { AboutPage } from "./pages/AboutPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <NeuralHUD />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "timeline",
        element: <AuditTimeline />,
      },
      {
        path: "sync",
        element: <DeviceSyncHub />,
      },
      {
        path: "automation",
        element: <AutomationDashboard />,
      },
      {
        path: "files",
        element: <FileManager />,
      },
      {
        path: "windows",
        element: <WindowManager />,
      },
      {
        path: "security",
        element: <SecurityDashboard />,
      },
      {
        path: "whatsapp",
        element: <WhatsAppControl />,
      },
      {
        path: "desktop",
        element: <RemoteDesktop />,
      },
      {
        path: "input",
        element: <InputSimulator />,
      },
      {
        path: "media-tools",
        element: <MediaTools />,
      },
      {
        path: "training",
        element: <NeuralTraining />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
