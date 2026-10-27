// Local-First Storage & Data Management for PlanSutra AI
// Supports schema versioning, auto-save state, JSON import/export, and iCalendar ICS generation

import { EventPlan } from '@/types';
import { DEMO_COMMUNITY_EVENT } from '@/features/events/sampleData';
import { FullEventPlanSchema } from '@/schemas';

const STORAGE_KEY = 'plansutra_events_v1';
const ACTIVE_EVENT_KEY = 'plansutra_active_event_id';

export function getStoredEvents(): EventPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with Demo Community Event on first launch
      const initialEvents = [DEMO_COMMUNITY_EVENT];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEvents));
      return initialEvents;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [DEMO_COMMUNITY_EVENT];
  } catch (err) {
    console.error('Error reading events from localStorage:', err);
    return [DEMO_COMMUNITY_EVENT];
  }
}

export function getStoredEventById(id: string): EventPlan | null {
  const events = getStoredEvents();
  return events.find(e => e.id === id) || null;
}

export function saveStoredEvent(event: EventPlan): boolean {
  try {
    const events = getStoredEvents();
    const updated = {
      ...event,
      updatedAt: new Date().toISOString(),
      version: (event.version || 1) + 1,
    };

    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = updated;
    } else {
      events.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch (err) {
    console.error('Failed to save event:', err);
    return false;
  }
}

export function deleteStoredEvent(id: string): boolean {
  try {
    const events = getStoredEvents();
    const filtered = events.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete event:', err);
    return false;
  }
}

export function duplicateStoredEvent(id: string): EventPlan | null {
  try {
    const target = getStoredEventById(id);
    if (!target) return null;

    const duplicated: EventPlan = {
      ...JSON.parse(JSON.stringify(target)),
      id: `event-${Date.now()}`,
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };

    saveStoredEvent(duplicated);
    return duplicated;
  } catch (err) {
    console.error('Failed to duplicate event:', err);
    return null;
  }
}

export function exportEventToJSON(event: EventPlan) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(event, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importEventFromJSON(jsonString: string): { success: boolean; event?: EventPlan; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = FullEventPlanSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        success: false,
        error: `Invalid event backup structure: ${validation.error.issues.map(i => i.message).join(', ')}`,
      };
    }

    const importedPlan: EventPlan = {
      ...validation.data as EventPlan,
      id: `imported-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    saveStoredEvent(importedPlan);
    return { success: true, event: importedPlan };
  } catch (err: any) {
    return { success: false, error: 'Malformed JSON file. Please supply a valid PlanSutra backup.' };
  }
}

/**
 * Exports tasks as an RFC 5545 compliant iCalendar (.ics) file
 */
export function exportCalendarICS(event: EventPlan) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PlanSutra AI//Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:PlanSutra - ${event.name}`,
  ];

  event.tasks.forEach(task => {
    if (task.dueDate) {
      const cleanDate = task.dueDate.replace(/-/g, '');
      const uid = `task-${task.id}@plansutra.ai`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:[PlanSutra] ${task.title}`,
        `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n')} - Priority: ${task.priority}`,
        `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      );
    }
  });

  lines.push('END:VCALENDAR');
  const icsContent = lines.join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function getActiveEventId(): string | null {
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function setActiveEventId(id: string) {
  localStorage.setItem(ACTIVE_EVENT_KEY, id);
}
