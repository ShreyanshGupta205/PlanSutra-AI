import React, { useState } from 'react';
import { EventPlan, DayOfScheduleItem } from '@/types';
import { 
  Printer, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  MapPin, 
  User, 
  FileText 
} from 'lucide-react';

interface DayOfRunSheetTabProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const DayOfRunSheetTab: React.FC<DayOfRunSheetTabProps> = ({
  event,
  onUpdateEvent,
}) => {
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [newTime, setNewTime] = useState<string>('16:00');
  const [newEndTime, setNewEndTime] = useState<string>('17:00');
  const [newActivity, setNewActivity] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const sortedSchedule = [...event.dayOfSchedule].sort((a, b) => a.time.localeCompare(b.time));

  const handleToggleComplete = (itemId: string) => {
    const updated = event.dayOfSchedule.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted: !item.isCompleted,
        };
      }
      return item;
    });

    onUpdateEvent({
      ...event,
      dayOfSchedule: updated,
    });
  };

  const handleAddItem = () => {
    if (!newActivity.trim() || !newTime.trim()) return;

    const newItem: DayOfScheduleItem = {
      id: `sched-${Date.now()}`,
      time: newTime.trim(),
      endTime: newEndTime.trim() || undefined,
      activity: newActivity.trim(),
      owner: newOwner.trim() || undefined,
      location: newLocation.trim() || undefined,
      notes: newNotes.trim() || undefined,
      isCompleted: false,
    };

    onUpdateEvent({
      ...event,
      dayOfSchedule: [...event.dayOfSchedule, newItem],
    });

    setNewActivity('');
    setNewOwner('');
    setNewLocation('');
    setNewNotes('');
    setIsAddingItem(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = event.dayOfSchedule.filter(i => i.id !== itemId);
    onUpdateEvent({
      ...event,
      dayOfSchedule: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Print Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-navy-950">Day-Of Operational Run Sheet</h2>
          <p className="text-xs text-navy-600">Minute-by-minute execution timeline with assigned task owners and staging areas.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingItem(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add Activity</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-ivory-100 text-navy-800 border border-ivory-300 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer size={14} />
            <span>Print Run Sheet</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold font-serif">{event.name} — Day-Of Run Sheet</h1>
        <p className="text-sm">Date: {event.date} | Venue: {event.venueName}, {event.city} | Expected Guests: {event.guestCount}</p>
      </div>

      {/* Add Activity Form */}
      {isAddingItem && (
        <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-soft space-y-3 no-print">
          <h3 className="font-bold text-sm text-navy-950">Add Run Sheet Item</h3>
          <div className="grid sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Start Time (HH:MM)</label>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">End Time (Optional)</label>
              <input
                type="time"
                value={newEndTime}
                onChange={e => setNewEndTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-navy-700 font-semibold mb-1">Activity Title *</label>
              <input
                type="text"
                placeholder="e.g. Welcome Drinks & Registration Counter Opens"
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Assigned Owner</label>
              <input
                type="text"
                placeholder="e.g. Sunita Patel"
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Location / Zone</label>
              <input
                type="text"
                placeholder="e.g. Foyer / Main Hall"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-navy-700 font-semibold mb-1">Operational Notes</label>
              <input
                type="text"
                placeholder="e.g. 2 volunteers with guest list clipboards"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingItem(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-navy-600 hover:bg-ivory-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
            >
              Add Activity
            </button>
          </div>
        </div>
      )}

      {/* Chronological Run Sheet Timeline */}
      <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft overflow-hidden">
        <div className="divide-y divide-ivory-100">
          {sortedSchedule.length === 0 ? (
            <p className="p-8 text-center text-xs text-navy-600">No day-of activities added yet.</p>
          ) : (
            sortedSchedule.map((item, idx) => {
              const isDone = item.isCompleted;

              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-start gap-4 transition-colors print-break-inside-avoid ${
                    isDone ? 'bg-emerald-50/20 text-navy-500' : 'hover:bg-ivory-50/50'
                  }`}
                >
                  {/* Status Toggle Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className={`mt-1 shrink-0 no-print transition-transform active:scale-90 ${
                      isDone ? 'text-emerald-700' : 'text-ivory-400 hover:text-navy-700'
                    }`}
                    title={isDone ? 'Mark as Incomplete' : 'Mark as Done'}
                    aria-label={`Toggle completion for ${item.activity}`}
                  >
                    {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>

                  {/* Time Badge */}
                  <div className="shrink-0 w-24 text-center p-2 rounded-lg bg-ivory-100 border border-ivory-200">
                    <span className="font-mono font-bold text-xs text-navy-950 block">
                      {item.time}
                    </span>
                    {item.endTime && (
                      <span className="text-[10px] text-navy-500 block">
                        until {item.endTime}
                      </span>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${isDone ? 'line-through text-navy-400' : 'text-navy-950'}`}>
                      {item.activity}
                    </h3>

                    {item.notes && (
                      <p className="text-xs text-navy-700 mt-1">{item.notes}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-navy-500">
                      {item.owner && (
                        <span className="flex items-center gap-1 font-medium text-navy-800">
                          <User size={12} className="text-emerald-700" />
                          <span>Owner: {item.owner}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-700" />
                          <span>{item.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 no-print">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-navy-400 hover:text-red-600 rounded"
                      title="Delete Activity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
