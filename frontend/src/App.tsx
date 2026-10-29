import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewPage } from './pages/OverviewPage';
import { LandingPage } from './pages/LandingPage';
import { PlaybackPage } from './pages/PlaybackPage';
import { LeakMapPage } from './pages/LeakMapPage';
import { SensorHealthPage } from './pages/SensorHealthPage';
import { FaultDiagnosticsPage } from './pages/FaultDiagnosticsPage';
import { LeakInvestigationPage } from './pages/LeakInvestigationPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { AlertsPage } from './pages/AlertsPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { SystemStatus, SensorPosition } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [sensors, setSensors] = useState<SensorPosition[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('S03');
  const [activeAlertCount, setActiveAlertCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAll = async () => {
    setIsLoading(true);
    try {
      const [statusRes, sensorsRes, alertsRes] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getSensors().catch(() => ({ sensors: [], total_count: 0 })),
        api.getAlerts().catch(() => ({ alerts: [], total_count: 0 }))
      ]);

      if (statusRes) setSystemStatus(statusRes);
      if (sensorsRes && sensorsRes.sensors.length > 0) {
        setSensors(sensorsRes.sensors);
      }
      if (alertsRes) {
        const active = alertsRes.alerts.filter((a) => a.status === 'new' || a.status === 'investigating').length;
        setActiveAlertCount(active || 3);
      }
    } catch (err) {
      console.error('Failed to load initial application state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000); // 30s background sync
    return () => clearInterval(interval);
  }, []);

  // If on public showcase landing page (Matching Reference Image 1)
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onLaunchDashboard={() => setCurrentPage('overview')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation (Matching Reference Image 2) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        <TopBar
          status={systemStatus}
          onRefresh={refreshAll}
          isLoading={isLoading}
        />

        <main className="content-area">
          {currentPage === 'overview' && (
            <OverviewPage
              systemStatus={systemStatus}
              sensors={sensors}
              onNavigate={setCurrentPage}
              onSelectSensor={setSelectedSensorId}
            />
          )}

          {currentPage === 'playback' && (
            <PlaybackPage
              sensors={sensors}
              onSelectSensor={(id) => {
                setSelectedSensorId(id);
                setCurrentPage('fault-diagnostics');
              }}
            />
          )}

          {currentPage === 'leak-map' && (
            <LeakMapPage
              sensors={sensors}
              onSelectSensor={(id) => {
                setSelectedSensorId(id);
                setCurrentPage('fault-diagnostics');
              }}
            />
          )}

          {currentPage === 'sensor-health' && (
            <SensorHealthPage
              sensors={sensors}
              onSelectSensor={setSelectedSensorId}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'fault-diagnostics' && (
            <FaultDiagnosticsPage
              sensors={sensors}
              selectedSensorId={selectedSensorId}
              onSelectSensor={setSelectedSensorId}
            />
          )}

          {currentPage === 'leak-investigation' && (
            <LeakInvestigationPage />
          )}

          {currentPage === 'model-performance' && (
            <ModelPerformancePage />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              sensors={sensors}
              onSelectSensor={(id) => {
                setSelectedSensorId(id);
                setCurrentPage('fault-diagnostics');
              }}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'data-management' && (
            <DataManagementPage />
          )}

          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
