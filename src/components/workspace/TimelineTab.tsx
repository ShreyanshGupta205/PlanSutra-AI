import React, { useState } from 'react';
import { EventPlan, Task, TaskPhase, TaskPriority, TaskStatus } from '@/types';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Trash2, 
  Edit2, 
  Link, 
  User, 
  HelpCircle,
  Check
} from 'lucide-react';

interface TimelineTabProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

const PHASE_LABELS: Record<TaskPhase, string> = {
  initial_planning: '1. Initial Planning',
  budget_venue: '2. Budget & Venue Decisions',
  vendor_selection: '3. Vendor Selection',
  invitations_guests: '4. Invitations & Guest Coordination',
  final_confirmations: '5. Final Confirmations',
  final_week: '6. Final-Week Preparation',
  day_of: '7. Day-Of Execution',
  post_event: '8. Post-Event Follow-Up',
};

export const TimelineTab: React.FC<TimelineTabProps> = ({
  event,
  onUpdateEvent,
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  // New Task form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPhase, setNewPhase] = useState<TaskPhase>('vendor_selection');
  const [newDueDate, setNewDueDate] = useState<string>(event.date || '');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssigned, setNewAssigned] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleTaskStatus = (taskId: string) => {
    const updatedTasks = event.tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
    });
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      phase: newPhase,
      dueDate: newDueDate || todayStr,
      priority: newPriority,
      status: 'pending',
      assignedTo: newAssigned.trim() || undefined,
      dependencies: [],
      reason: newReason.trim() || undefined,
    };

    onUpdateEvent({
      ...event,
      tasks: [...event.tasks, newTask],
    });

    setNewTitle('');
    setNewDesc('');
    setNewAssigned('');
    setNewReason('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = event.tasks.filter(t => t.id !== taskId);
    onUpdateEvent({
      ...event,
      tasks: updatedTasks,
    });
  };

  // Filter tasks
  const filteredTasks = event.tasks.filter(t => {
    if (filterPhase !== 'all' && t.phase !== filterPhase) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  // Group by phase
  const phases = Object.keys(PHASE_LABELS) as TaskPhase[];

  // Task map for checking dependencies
  const taskMap = new Map(event.tasks.map(t => [t.id, t]));

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950">Timeline & Operational Tasks</h2>
          <p className="text-xs text-navy-600">Phased milestones with prerequisite validation and deadline tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-ivory-300 text-xs text-navy-800 bg-white"
          >
            <option value="all">All Phases</option>
            {phases.map(p => (
              <option key={p} value={p}>{PHASE_LABELS[p]}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-ivory-300 text-xs text-navy-800 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          <button
            onClick={() => setIsAddingTask(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal / Panel */}
      {isAddingTask && (
        <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-navy-950">Add Milestone Task</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-navy-700 font-semibold mb-1">Task Title *</label>
              <input
                type="text"
                placeholder="e.g. Confirm acoustic sound check with local authorities"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Planning Phase</label>
              <select
                value={newPhase}
                onChange={e => setNewPhase(e.target.value as TaskPhase)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300 bg-white"
              >
                {phases.map(p => (
                  <option key={p} value={p}>{PHASE_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Target Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Assigned Volunteer / Lead</label>
              <input
                type="text"
                placeholder="e.g. Vikram Mehta"
                value={newAssigned}
                onChange={e => setNewAssigned(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-navy-700 font-semibold mb-1">Why this deadline matters (Reason)</label>
              <input
                type="text"
                placeholder="e.g. Police sound permits require 15 days notice before event date"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-navy-600 hover:bg-ivory-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
            >
              Save Milestone
            </button>
          </div>
        </div>
      )}

      {/* Phased Task List */}
      <div className="space-y-6">
        {phases.map(phaseKey => {
          const phaseTasks = filteredTasks.filter(t => t.phase === phaseKey);
          if (phaseTasks.length === 0) return null;

          return (
            <div key={phaseKey} className="bg-white rounded-2xl border border-ivory-200 shadow-soft overflow-hidden">
              <div className="bg-ivory-100/70 px-5 py-3 border-b border-ivory-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-navy-950">{PHASE_LABELS[phaseKey]}</h3>
                <span className="text-xs text-navy-600">
                  {phaseTasks.filter(t => t.status === 'completed').length} / {phaseTasks.length} Done
                </span>
              </div>

              <div className="divide-y divide-ivory-100">
                {phaseTasks.map(task => {
                  const isOverdue = task.status !== 'completed' && task.dueDate && task.dueDate < todayStr;
                  const isCompleted = task.status === 'completed';

                  // Check dependencies
                  const brokenDep = task.dependencies.find(depId => {
                    const prereq = taskMap.get(depId);
                    return !prereq || prereq.status !== 'completed';
                  });

                  return (
                    <div 
                      key={task.id}
                      className={`p-4 flex items-start gap-3 transition-colors ${
                        isCompleted ? 'bg-emerald-50/20 text-navy-500' : isOverdue ? 'bg-red-50/30' : 'hover:bg-ivory-50/50'
                      }`}
                    >
                      {/* Completion Toggle Checkbox */}
                      <button
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                          isCompleted ? 'text-emerald-700' : 'text-ivory-400 hover:text-navy-700'
                        }`}
                        title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                        aria-label={`Toggle completion for ${task.title}`}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className={`font-bold text-sm ${isCompleted ? 'line-through text-navy-400' : 'text-navy-950'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            task.priority === 'critical' ? 'bg-red-100 text-red-800' : task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-ivory-200 text-navy-700'
                          }`}>
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>Overdue</span>
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-navy-700 mt-1">{task.description}</p>
                        )}

                        {task.reason && (
                          <p className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                            <HelpCircle size={12} className="shrink-0" />
                            <span>Why: {task.reason}</span>
                          </p>
                        )}

                        {brokenDep && (
                          <div className="mt-1.5 text-[11px] text-amber-800 flex items-center gap-1">
                            <Link size={12} />
                            <span>Prerequisite incomplete: "{taskMap.get(brokenDep)?.title || brokenDep}"</span>
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-navy-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>Due: {task.dueDate}</span>
                          </span>
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              <span>{task.assignedTo}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-navy-400">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 hover:text-red-600 rounded"
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
