import React, { useState } from 'react';
import { 
  EventType, 
  EventSetting, 
  SpendingLevel, 
  OptimizationMode, 
  EventPlan, 
  PersonalizationPreferences,
  Task,
  BudgetCategory,
  Vendor,
  DayOfScheduleItem
} from '@/types';
import { CreateEventRequestSchema } from '@/schemas';
import { formatINR } from '@/lib/currency';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Calendar, 
  Coins, 
  HeartHandshake, 
  Check, 
  HelpCircle,
  Accessibility,
  Utensils,
  Leaf
} from 'lucide-react';

interface EventCreationWizardProps {
  onPlanCreated: (plan: EventPlan) => void;
  onCancel: () => void;
}

export const EventCreationWizard: React.FC<EventCreationWizardProps> = ({
  onPlanCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<EventType>('community');
  const [date, setDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>('');
  const [city, setCity] = useState<string>('Pune');
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const [guestCount, setGuestCount] = useState<number>(180);
  const [venueName, setVenueName] = useState<string>('Shanti Cultural Hall');
  const [venueCapacity, setVenueCapacity] = useState<string>('200');
  const [setting, setSetting] = useState<EventSetting>('mixed');

  // Budget State
  const [totalBudget, setTotalBudget] = useState<number>(150000);
  const [spendingLevel, setSpendingLevel] = useState<SpendingLevel>('balanced');
  const [priorityCategories, setPriorityCategories] = useState<string[]>([
    'Catering',
    'Stage & Sound',
  ]);
  const [contingencyReservePercent, setContingencyReservePercent] = useState<number>(10);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('balanced');

  // Personalization State
  const [themeStyle, setThemeStyle] = useState<string>('Traditional Eco-Friendly Festive');
  const [colors, setColors] = useState<string>('Marigold Orange, Emerald Green, Warm Gold');
  const [culturalTraditions, setCulturalTraditions] = useState<string>('Traditional Lamp Lighting, Folk invocation');
  const [dietaryOptions, setDietaryOptions] = useState<string[]>(['Pure Vegetarian', 'Jain Options']);
  const [accessibilityOptions, setAccessibilityOptions] = useState<string[]>([
    'Wheelchair Ramp to Main Hall',
    'Elderly Priority Seating',
  ]);
  const [entertainment, setEntertainment] = useState<string>('Local folk artists & youth cultural performances');
  const [sustainability, setSustainability] = useState<string>('Zero single-use plastic, compostable plates');
  const [mustHaves, setMustHaves] = useState<string>('Grand welcome ceremony, group photo');
  const [itemsToAvoid, setItemsToAvoid] = useState<string>('Loud sound amplification past 10 PM, plastic bottles');

  // Toggle helpers
  const toggleDietary = (item: string) => {
    setDietaryOptions(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleAccessibility = (item: string) => {
    setAccessibilityOptions(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Generation Handler
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setErrorNotice(null);

    const parsedVenueCapacity = venueCapacity ? parseInt(venueCapacity, 10) : undefined;
    const colorList = colors.split(',').map(c => c.trim()).filter(Boolean);

    const payload = {
      name,
      type,
      date,
      endDate: endDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      city,
      guestCount,
      venueName: venueName || undefined,
      venueCapacity: parsedVenueCapacity && !isNaN(parsedVenueCapacity) ? parsedVenueCapacity : undefined,
      setting,
      totalBudget,
      contingencyReservePercent,
      spendingLevel,
      priorityCategories,
      optimizationMode,
      personalization: {
        themeStyle,
        colors: colorList,
        culturalTraditions,
        foodDietary: dietaryOptions,
        accessibility: accessibilityOptions,
        entertainment: entertainment ? [entertainment] : [],
        sustainability,
        mustHaveMoments: mustHaves.split(',').map(m => m.trim()).filter(Boolean),
        itemsToAvoid: itemsToAvoid.split(',').map(m => m.trim()).filter(Boolean),
      },
    };

    // Client-side Zod validation before request
    const validation = CreateEventRequestSchema.safeParse(payload);
    if (!validation.success) {
      setIsGenerating(false);
      setErrorNotice(`Validation error: ${validation.error.issues[0].message}`);
      return;
    }

    try {
      setGenerationPhase('Understanding your event brief & constraints...');
      await new Promise(r => setTimeout(r, 600));

      setGenerationPhase('Allocating category budgets & checking financial reconciliation...');
      await new Promise(r => setTimeout(r, 600));

      setGenerationPhase('Drafting timeline phases & vendor checklists...');

      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      setGenerationPhase('Verifying plan with Plan Doctor integrity engine...');
      const result = await response.json();

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to generate plan.');
      }

      const generatedData = result.plan;

      // Construct complete EventPlan domain entity
      const newPlan: EventPlan = {
        id: `event-${Date.now()}`,
        name: payload.name,
        type: payload.type,
        date: payload.date,
        endDate: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        city: payload.city,
        guestCount: payload.guestCount,
        venueName: payload.venueName,
        venueCapacity: payload.venueCapacity,
        setting: payload.setting,
        totalBudget: payload.totalBudget,
        contingencyReservePercent: payload.contingencyReservePercent,
        spendingLevel: payload.spendingLevel,
        priorityCategories: payload.priorityCategories,
        optimizationMode: payload.optimizationMode,
        budgetCategories: generatedData.budgetCategories.map((c: any, index: number) => ({
          id: `cat-${index + 1}`,
          name: c.name,
          allocated: c.allocated,
          estimated: c.allocated,
          quoted: 0,
          actual: 0,
          paid: 0,
          notes: c.notes || '',
          costPerGuestApplicable: c.costPerGuestApplicable,
          costPerGuestAmount: c.costPerGuestAmount,
          isContingency: c.name.toLowerCase().includes('contingency'),
        })),
        tasks: generatedData.tasks.map((t: any, index: number) => {
          const targetDate = new Date(payload.date);
          targetDate.setDate(targetDate.getDate() - (t.daysBeforeEvent || 10));
          return {
            id: `task-${index + 1}`,
            title: t.title,
            description: t.description,
            phase: t.phase,
            dueDate: targetDate.toISOString().split('T')[0],
            priority: t.priority,
            status: 'pending' as const,
            dependencies: [],
            reason: t.reason || '',
          };
        }),
        vendors: generatedData.vendorChecklist.map((v: any, index: number) => ({
          id: `vendor-${index + 1}`,
          name: v.suggestedName || `Suggested ${v.category}`,
          category: v.category,
          quotedAmount: v.estimatedCost || 0,
          quoteStatus: 'pending' as const,
          bookingStatus: 'unbooked' as const,
          depositPaid: 0,
          balanceDue: v.estimatedCost || 0,
          servicesIncluded: v.keyServices || [],
          exclusions: [],
          setupTransportCharges: 0,
          taxAmount: 0,
          cancellationTerms: 'Review upon contract receipt',
          notes: `Negotiation questions: ${(v.questionsToAsk || []).join('; ')}`,
          relatedTaskIds: [],
        })),
        dayOfSchedule: generatedData.dayOfSchedule.map((s: any, index: number) => ({
          id: `sched-${index + 1}`,
          time: s.time,
          endTime: s.endTime,
          activity: s.activity,
          owner: s.owner || 'Lead Organizer',
          notes: s.notes || '',
          isCompleted: false,
        })),
        personalization: payload.personalization,
        aiAssumptions: generatedData.assumptions || [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: result.isDemoPlan,
      };

      setIsGenerating(false);
      onPlanCreated(newPlan);
    } catch (err: any) {
      console.error('Plan creation failed:', err);
      setIsGenerating(false);
      setErrorNotice(err.message || 'An error occurred during generation.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Wizard Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={14} />
          <span>New Celebration Blueprint</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-navy-950">Event Planning Wizard</h1>
        <p className="text-sm text-navy-700 mt-1">Let's craft a structured, financially reconciled plan for your celebration.</p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Budget' },
            { num: 3, label: 'Personalization' },
            { num: 4, label: 'Review' },
          ].map(step => (
            <div key={step.num} className="flex items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step.num 
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-100' 
                    : currentStep > step.num 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-ivory-200 text-navy-600'
                }`}
              >
                {currentStep > step.num ? <Check size={14} /> : step.num}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${currentStep === step.num ? 'text-navy-950 font-bold' : 'text-navy-600'}`}>
                {step.label}
              </span>
              {step.num < 4 && <div className="w-6 sm:w-12 h-0.5 bg-ivory-300 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft p-6 sm:p-8">
        {/* STEP 1: EVENT BASICS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy-950 border-b border-ivory-200 pb-3">Step 1: Event Basics</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="event-name">
                  Event Name *
                </label>
                <input
                  id="event-name"
                  type="text"
                  required
                  placeholder="e.g. Shanti Nagar Community Cultural Utsav"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="event-type">
                  Occasion Type *
                </label>
                <select
                  id="event-type"
                  value={type}
                  onChange={e => setType(e.target.value as EventType)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                >
                  <option value="community">Community Celebration / Utsav</option>
                  <option value="wedding">Wedding & Sangeet</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="college_fest">College Cultural / Tech Fest</option>
                  <option value="corporate">Corporate Gala & Awards</option>
                  <option value="custom">Custom Celebration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="event-city">
                  City / Location *
                </label>
                <input
                  id="event-city"
                  type="text"
                  required
                  placeholder="e.g. Pune, Bangalore, Delhi"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="event-date">
                  Celebration Date *
                </label>
                <input
                  id="event-date"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="guest-count">
                  Expected Guest Count *
                </label>
                <input
                  id="guest-count"
                  type="number"
                  min="5"
                  max="10000"
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="start-time">
                  Start Time
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="end-time">
                  End Time
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="venue-name">
                  Venue Name (if shortlisted)
                </label>
                <input
                  id="venue-name"
                  type="text"
                  placeholder="e.g. Shanti Cultural Hall"
                  value={venueName}
                  onChange={e => setVenueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="venue-capacity">
                  Confirmed Venue Capacity
                </label>
                <input
                  id="venue-capacity"
                  type="number"
                  placeholder="Leave empty if unconfirmed"
                  value={venueCapacity}
                  onChange={e => setVenueCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
                <p className="text-[11px] text-navy-600 mt-1">Plan Doctor checks capacity vs guest count deterministically.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
                  Venue Setting *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['indoor', 'outdoor', 'mixed'] as EventSetting[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSetting(s)}
                      className={`p-3 rounded-lg border text-xs font-semibold capitalize text-center transition-all ${
                        setting === s 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600' 
                          : 'border-ivory-300 text-navy-700 hover:bg-ivory-50'
                      }`}
                    >
                      {s} Setting
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET & PRIORITIES */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy-950 border-b border-ivory-200 pb-3">Step 2: Budget & Financial Guardrails</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="total-budget">
                  Total Available Budget in INR (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-navy-500 font-bold">₹</span>
                  <input
                    id="total-budget"
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    value={totalBudget}
                    onChange={e => setTotalBudget(parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm font-semibold"
                  />
                </div>
                <div className="mt-1 flex justify-between items-center text-xs text-navy-600">
                  <span>Formatted: {formatINR(totalBudget)}</span>
                  <span>Approx. {formatINR(guestCount > 0 ? totalBudget / guestCount : 0)} / guest</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
                  Spending Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'budget_conscious', label: 'Budget-Conscious', desc: 'Focus on essential savings' },
                    { id: 'balanced', label: 'Balanced', desc: 'Smart quality-to-cost ratio' },
                    { id: 'premium', label: 'Premium', desc: 'Curated elevated experience' },
                  ].map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSpendingLevel(tier.id as SpendingLevel)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        spendingLevel === tier.id 
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' 
                          : 'border-ivory-300 hover:bg-ivory-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-navy-950">{tier.label}</p>
                      <p className="text-[11px] text-navy-600 mt-0.5">{tier.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="contingency-percent">
                  Contingency Reserve: {contingencyReservePercent}% ({formatINR(Math.round(totalBudget * (contingencyReservePercent / 100)))})
                </label>
                <input
                  id="contingency-percent"
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={contingencyReservePercent}
                  onChange={e => setContingencyReservePercent(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <p className="text-[11px] text-navy-600 mt-1">Plan Doctor warns if contingency is 0% to protect against last-minute overtime/weather buffers.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
                  Optimization Strategy
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'minimize_costs', label: 'Minimize Costs', desc: 'Prioritize lowest quotes' },
                    { id: 'balanced', label: 'Balanced', desc: 'Equitable allocation' },
                    { id: 'maximize_experience', label: 'Max Experience', desc: 'Invest heavily in guest impact' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOptimizationMode(opt.id as OptimizationMode)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        optimizationMode === opt.id 
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600' 
                          : 'border-ivory-300 hover:bg-ivory-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-navy-950">{opt.label}</p>
                      <p className="text-[11px] text-navy-600 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PERSONALIZATION & INCLUSIVITY */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy-950 border-b border-ivory-200 pb-3">Step 3: Personalization & Inclusivity</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="theme-style">
                  Theme Concept & Atmosphere
                </label>
                <input
                  id="theme-style"
                  type="text"
                  placeholder="e.g. Traditional Festive & Eco-Friendly Community Utsav"
                  value={themeStyle}
                  onChange={e => setThemeStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="colors-input">
                  Color Palette (comma-separated)
                </label>
                <input
                  id="colors-input"
                  type="text"
                  placeholder="e.g. Marigold Orange, Emerald Green, Warm Gold"
                  value={colors}
                  onChange={e => setColors(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              {/* Food & Dietary */}
              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils size={14} className="text-emerald-700" />
                  <span>Food & Dietary Preferences</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Pure Vegetarian', 'Jain Options', 'Vegan', 'Halal', 'Nut-Free', 'Gluten-Free'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDietary(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        dietaryOptions.includes(item)
                          ? 'bg-emerald-700 text-white'
                          : 'bg-ivory-100 text-navy-800 border border-ivory-300 hover:bg-ivory-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility */}
              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Accessibility size={14} className="text-emerald-700" />
                  <span>Accessibility & Logistical Inclusivity</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Wheelchair Ramp to Main Hall',
                    'Elevator / Lift Access',
                    'Elderly Priority Seating',
                    'Sign Language Interpreter',
                    'Dedicated Accessible Restroom',
                  ].map(acc => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => toggleAccessibility(acc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        accessibilityOptions.includes(acc)
                          ? 'bg-emerald-700 text-white'
                          : 'bg-ivory-100 text-navy-800 border border-ivory-300 hover:bg-ivory-200'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-navy-600 mt-1">Plan Doctor checks if accessibility requirements have scheduled venue verification tasks.</p>
              </div>

              {/* Sustainability */}
              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5" htmlFor="sustainability-input">
                  <Leaf size={14} className="text-emerald-700" />
                  <span>Sustainability Mandates</span>
                </label>
                <input
                  id="sustainability-input"
                  type="text"
                  placeholder="e.g. Zero single-use plastic, compostable areca leaf plates"
                  value={sustainability}
                  onChange={e => setSustainability(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5" htmlFor="cultural-input">
                  Ceremonial & Cultural Rituals
                </label>
                <input
                  id="cultural-input"
                  type="text"
                  placeholder="e.g. Traditional Deep Prajwalan, local folk invocation"
                  value={culturalTraditions}
                  onChange={e => setCulturalTraditions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-ivory-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW SUMMARY */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy-950 border-b border-ivory-200 pb-3">Step 4: Review Event Brief</h2>

            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-ivory-200">
                <div>
                  <span className="text-xs text-navy-600 block">Event Name:</span>
                  <span className="font-bold text-navy-950">{name || 'Unnamed Celebration'}</span>
                </div>
                <div>
                  <span className="text-xs text-navy-600 block">Occasion:</span>
                  <span className="font-bold text-navy-950 capitalize">{type.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-ivory-200">
                <div>
                  <span className="text-xs text-navy-600 block">Target Date:</span>
                  <span className="font-semibold text-navy-950">{date}</span>
                </div>
                <div>
                  <span className="text-xs text-navy-600 block">City:</span>
                  <span className="font-semibold text-navy-950">{city}</span>
                </div>
                <div>
                  <span className="text-xs text-navy-600 block">Guest Count:</span>
                  <span className="font-semibold text-navy-950">{guestCount} Guests</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-ivory-200">
                <div>
                  <span className="text-xs text-navy-600 block">Total Budget:</span>
                  <span className="font-bold text-emerald-800 text-base">{formatINR(totalBudget)}</span>
                </div>
                <div>
                  <span className="text-xs text-navy-600 block">Contingency Reserve:</span>
                  <span className="font-semibold text-navy-950">
                    {contingencyReservePercent}% ({formatINR(Math.round(totalBudget * (contingencyReservePercent / 100)))})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-navy-600 block">Venue:</span>
                <span className="font-semibold text-navy-950">
                  {venueName || 'Venue to be decided'} {venueCapacity ? `(Capacity: ${venueCapacity})` : '(Capacity unrecorded)'} — {setting}
                </span>
              </div>

              <div>
                <span className="text-xs text-navy-600 block">Personalization & Dietary:</span>
                <span className="text-xs text-navy-800">
                  {themeStyle} | Dietary: {dietaryOptions.join(', ') || 'None specified'} | Accessibility: {accessibilityOptions.join(', ') || 'None specified'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <HelpCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Transparent Engineering Notice: </span>
                AI generates a structured, schema-validated draft blueprint. Financial calculations and validation are performed deterministically by Plan Doctor. Initial vendor costs are market estimates requiring quotes.
              </div>
            </div>

            {errorNotice && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE MODAL / OVERLAY */}
        {isGenerating && (
          <div className="my-8 text-center p-6 rounded-xl bg-ivory-50 border border-emerald-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 animate-spin">
              <RotateCw size={24} />
            </div>
            <h3 className="font-bold text-navy-950 text-base">Synthesizing Celebration Blueprint</h3>
            <p className="text-xs text-emerald-800 font-semibold mt-1 animate-pulse">
              {generationPhase}
            </p>
            <p className="text-[11px] text-navy-600 mt-3">
              Enforcing Zod schema validation & deterministic budget reconciliation...
            </p>
          </div>
        )}

        {/* Form Controls Navigation */}
        <div className="mt-8 pt-4 border-t border-ivory-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && !isGenerating && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-navy-700 hover:bg-ivory-100 border border-ivory-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
            )}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-navy-600 hover:bg-ivory-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !name.trim()) {
                    setErrorNotice('Please provide an event name.');
                    return;
                  }
                  setErrorNotice(null);
                  setCurrentStep(prev => prev + 1);
                }}
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePlan}
                id="wizard-generate-plan-btn"
                className="px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-medium hover:shadow-lifted transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={16} className="text-marigold-300" />
                <span>Generate Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
