import React, { useState, useEffect } from 'react';
import { EventPlan } from '@/types';
import { 
  getStoredEvents, 
  saveStoredEvent, 
  deleteStoredEvent, 
  duplicateStoredEvent, 
  getActiveEventId, 
  setActiveEventId 
} from '@/lib/storage';
import { DEMO_COMMUNITY_EVENT } from '@/features/events/sampleData';
import { LandingPage } from '@/components/landing/LandingPage';

// Lazy load secondary views for optimal initial bundle size and sub-second LCP
const UserDashboard = React.lazy(() => import('@/components/dashboard/UserDashboard').then(m => ({ default: m.UserDashboard })));
const EventCreationWizard = React.lazy(() => import('@/components/wizard/EventCreationWizard').then(m => ({ default: m.EventCreationWizard })));
const EventWorkspace = React.lazy(() => import('@/components/workspace/EventWorkspace').then(m => ({ default: m.EventWorkspace })));
const AdminDashboard = React.lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const ViewLoader = () => (
  <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-4" aria-busy="true">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-navy-800">Loading PlanSutra workspace...</span>
    </div>
  </div>
);

type AppView = 'landing' | 'dashboard' | 'wizard' | 'workspace' | 'admin';

export function App() {
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('landing');

  // Load stored events on mount
  useEffect(() => {
    const loaded = getStoredEvents();
    setEvents(loaded);

    // Check URL hash for admin route or direct workspace link
    if (window.location.hash === '#admin') {
      setCurrentView('admin');
    } else {
      const storedActiveId = getActiveEventId();
      if (storedActiveId && loaded.some(e => e.id === storedActiveId)) {
        setActiveEventIdState(storedActiveId);
      }
    }

    // Listen for hash changes
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeEvent = events.find(e => e.id === activeEventId) || null;

  // Handlers
  const handleOpenEvent = (id: string) => {
    setActiveEventId(id);
    setActiveEventIdState(id);
    setCurrentView('workspace');
  };

  const handleUpdateEvent = (updated: EventPlan) => {
    saveStoredEvent(updated);
    setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvent = (id: string) => {
    deleteStoredEvent(id);
    const remaining = events.filter(e => e.id !== id);
    setEvents(remaining);
    if (activeEventId === id) {
      setActiveEventIdState(null);
      setCurrentView('dashboard');
    }
  };

  const handleDuplicateEvent = (id: string) => {
    const copy = duplicateStoredEvent(id);
    if (copy) {
      setEvents(getStoredEvents());
    }
  };

  const handleLoadDemo = () => {
    saveStoredEvent(DEMO_COMMUNITY_EVENT);
    const refreshed = getStoredEvents();
    setEvents(refreshed);
    handleOpenEvent(DEMO_COMMUNITY_EVENT.id);
  };

  const handlePlanCreated = (newPlan: EventPlan) => {
    saveStoredEvent(newPlan);
    setEvents(getStoredEvents());
    handleOpenEvent(newPlan.id);
  };

  // Render view
  if (currentView === 'admin') {
    return (
      <React.Suspense fallback={<ViewLoader />}>
        <AdminDashboard 
          onBackToApp={() => {
            window.location.hash = '';
            setCurrentView('dashboard');
          }} 
        />
      </React.Suspense>
    );
  }

  if (currentView === 'wizard') {
    return (
      <React.Suspense fallback={<ViewLoader />}>
        <EventCreationWizard
          onPlanCreated={handlePlanCreated}
          onCancel={() => setCurrentView('dashboard')}
        />
      </React.Suspense>
    );
  }

  if (currentView === 'workspace' && activeEvent) {
    return (
      <React.Suspense fallback={<ViewLoader />}>
        <EventWorkspace
          event={activeEvent}
          onUpdateEvent={handleUpdateEvent}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      </React.Suspense>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <React.Suspense fallback={<ViewLoader />}>
        <UserDashboard
          events={events}
          onOpenEvent={handleOpenEvent}
          onCreateEvent={() => setCurrentView('wizard')}
          onDuplicateEvent={handleDuplicateEvent}
          onDeleteEvent={handleDeleteEvent}
          onLoadDemoEvent={handleLoadDemo}
          onBackToLanding={() => setCurrentView('landing')}
        />
      </React.Suspense>
    );
  }

  // Default: Landing Page
  return (
    <LandingPage
      onStartPlanning={() => setCurrentView('wizard')}
      onExploreDemo={handleLoadDemo}
      onGoToDashboard={() => setCurrentView('dashboard')}
      onOpenAdmin={() => {
        window.location.hash = '#admin';
        setCurrentView('admin');
      }}
    />
  );
}

export default App;
