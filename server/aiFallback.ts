// Deterministic Fallback Generator for AI Services
// Provides structured, personalized, schema-compliant event plans when Gemini API key is unset or unreachable

import { CreateEventRequestSchema } from '../src/schemas';
import { z } from 'zod';

type EventRequest = z.infer<typeof CreateEventRequestSchema>;

export function generateFallbackPlan(request: EventRequest) {
  const { name, type, guestCount, totalBudget, city, setting, personalization, contingencyReservePercent } = request;
  
  // Allocate contingency
  const contingencyPercent = contingencyReservePercent || 10;
  const contingencyAmount = Math.round(totalBudget * (contingencyPercent / 100));
  const distributableBudget = totalBudget - contingencyAmount;

  let themeConcept = personalization.themeStyle || `Elegant ${type.replace('_', ' ')} Celebration`;
  let palette = personalization.colors && personalization.colors.length > 0
    ? personalization.colors
    : ['Emerald Green', 'Warm Ivory', 'Marigold Gold'];

  // Calculate proportional category budgets based on event type
  let categoryRatios: { name: string; share: number; perGuest?: boolean; notes: string }[] = [];

  if (type === 'wedding') {
    categoryRatios = [
      { name: 'Venue & Banqueting', share: 0.32, notes: `Premium banquet hall in ${city} for ${guestCount} guests.` },
      { name: 'Catering & Dining', share: 0.30, perGuest: true, notes: `Multi-course wedding feast for ${guestCount} guests.` },
      { name: 'Decor & Mandap Styling', share: 0.16, notes: 'Floral mandap, stage backdrop, and entrance arch.' },
      { name: 'Photography & Cinematography', share: 0.12, notes: 'Full day coverage with candid photos and teaser reel.' },
      { name: 'Entertainment & DJ', share: 0.10, notes: 'Sound setup, DJ console, and sangeet lighting.' },
    ];
  } else if (type === 'birthday') {
    categoryRatios = [
      { name: 'Catering, Cake & Drinks', share: 0.40, perGuest: true, notes: `Party buffet, custom themed cake, and mocktails.` },
      { name: 'Venue / Party Hall', share: 0.25, notes: `Party venue in ${city} suited for ${guestCount} people.` },
      { name: 'Themed Decor & Balloons', share: 0.20, notes: 'Custom balloon arches, backdrop, and table centerpieces.' },
      { name: 'Emcee & Party Games', share: 0.15, notes: 'Host, music playlist, party games, and prizes.' },
    ];
  } else if (type === 'community') {
    categoryRatios = [
      { name: 'Catering & Traditional Buffet', share: 0.42, perGuest: true, notes: `Buffet dinner for ${guestCount} community members.` },
      { name: 'Venue Hall & Generator Backup', share: 0.22, notes: `Civic auditorium or community center in ${city}.` },
      { name: 'Stage Decor & Rangoli', share: 0.18, notes: 'Eco-friendly florals, welcome arches, and stage lighting.' },
      { name: 'Sound System & Cultural Performers', share: 0.18, notes: 'Cordless mics, speakers, and folk troupe honorarium.' },
    ];
  } else if (type === 'college_fest') {
    categoryRatios = [
      { name: 'Stage, Truss & Sound Line Array', share: 0.36, notes: 'Outdoor concert stage and high-output audio system.' },
      { name: 'Headliner Artist / Band', share: 0.32, notes: 'Artist booking fees and technical hospitality rider.' },
      { name: 'Campus Security & Barricades', share: 0.16, notes: 'Crowd control, security personnel, and first aid booth.' },
      { name: 'Prizes, Trophies & Merchandise', share: 0.16, notes: 'Competition cash prizes, medals, and volunteer shirts.' },
    ];
  } else {
    categoryRatios = [
      { name: 'Venue & Facilities', share: 0.35, notes: `Primary facility in ${city}.` },
      { name: 'Catering & Hospitality', share: 0.35, perGuest: true, notes: `Meals and refreshments for ${guestCount} guests.` },
      { name: 'Decor, Staging & AV', share: 0.20, notes: 'Audiovisual projection and event decor.' },
      { name: 'Coordination & Staff', share: 0.10, notes: 'Event managers and support team.' },
    ];
  }

  // Generate budget categories
  let budgetCategories = categoryRatios.map(cat => {
    const allocated = Math.round(distributableBudget * cat.share);
    const costPerGuest = cat.perGuest && guestCount > 0 ? allocated / guestCount : undefined;
    return {
      name: cat.name,
      allocated,
      notes: cat.notes,
      costPerGuestApplicable: !!cat.perGuest,
      costPerGuestAmount: costPerGuest ? Math.round(costPerGuest * 100) / 100 : undefined,
    };
  });

  // Reconcile rounding to ensure exact sum matches distributableBudget
  const currentSum = budgetCategories.reduce((acc, c) => acc + c.allocated, 0);
  const diff = distributableBudget - currentSum;
  if (diff !== 0 && budgetCategories.length > 0) {
    budgetCategories[0].allocated += diff;
  }

  // Add contingency category
  budgetCategories.push({
    name: `Contingency Reserve (${contingencyPercent}%)`,
    allocated: contingencyAmount,
    notes: 'Emergency reserve for overtime, last-minute changes, or weather mitigation.',
    costPerGuestApplicable: false,
    costPerGuestAmount: undefined,
  });

  // Generate structured tasks
  const tasks = [
    {
      title: `Finalize and book primary venue in ${city}`,
      description: `Confirm reservation terms, hall capacity for ${guestCount} guests, and payment milestones.`,
      phase: 'budget_venue' as const,
      daysBeforeEvent: 45,
      priority: 'critical' as const,
      reason: 'Venue availability locks down the date and physical logistics.',
    },
    {
      title: 'Compare and select catering provider',
      description: `Review menu tastings and confirm per-plate rates for ${guestCount} guests.`,
      phase: 'vendor_selection' as const,
      daysBeforeEvent: 30,
      priority: 'high' as const,
      reason: 'Caterers require advance notice for procurement and culinary staffing.',
    },
    {
      title: 'Finalize decoration style and floral concepts',
      description: `Confirm color theme (${palette.join(', ')}) and entrance focal points.`,
      phase: 'vendor_selection' as const,
      daysBeforeEvent: 20,
      priority: 'medium' as const,
      reason: 'Ensures fabrication materials and flowers are reserved.',
    },
    {
      title: 'Inspect accessibility and logistical access',
      description: 'Check wheelchair access, ramp gradient, restrooms, and parking flow.',
      phase: 'invitations_guests' as const,
      daysBeforeEvent: 14,
      priority: 'high' as const,
      reason: 'Ensures welcoming inclusivity for all guests.',
    },
    {
      title: 'Conduct pre-event walkthrough and vendor alignment',
      description: 'Verify sound levels, power backup generator, and run-sheet timing.',
      phase: 'final_week' as const,
      daysBeforeEvent: 3,
      priority: 'critical' as const,
      reason: 'Prevents day-of operational hiccups and technical delays.',
    },
  ];

  // Generate vendor checklist
  const vendorChecklist = [
    {
      category: 'Venue',
      suggestedName: `${city} Event Grounds / Hall`,
      estimatedCost: Math.round(totalBudget * 0.30),
      keyServices: ['Event hall', 'Air conditioning', 'Security guard', 'Parking area'],
      questionsToAsk: [
        'What is the cutoff time for amplified sound?',
        'Is generator power backup included in the rental cost?',
        'Are outside catering teams permitted without penalty?',
      ],
      negotiationTips: [
        'Ask for complimentary setup hours prior to the main event start time.',
        'Request waiver of cleaning fees if the organizer disposes of dry waste.',
      ],
    },
    {
      category: 'Catering',
      suggestedName: `${type === 'wedding' ? 'Royal Feast Caterers' : 'Delight Catering Services'}`,
      estimatedCost: Math.round(totalBudget * 0.32),
      keyServices: ['Food preparation', 'Chafing dishes', 'Waitstaff', 'Water counter'],
      questionsToAsk: [
        'How many service staff members are included in the quote?',
        'What is your buffer policy if attendance is 10% higher than contracted?',
        'Are tasting sessions complimentary prior to contract signing?',
      ],
      negotiationTips: [
        'Ask for a complimentary welcome drink or dessert upgrade.',
        'Negotiate payment split (30% advance, 50% week of, 20% post-event).',
      ],
    },
    {
      category: 'Decoration',
      suggestedName: 'Aura Event Designers',
      estimatedCost: Math.round(totalBudget * 0.18),
      keyServices: ['Stage backdrop', 'Welcome gate', 'Ambient lighting', 'Focal photobooth'],
      questionsToAsk: [
        'Are natural fresh flowers used or artificial fabrications?',
        'Does the quote include teardown and late-night dismantling?',
      ],
      negotiationTips: [
        'Combine entrance arch and photo backdrop for package discounting.',
      ],
    },
  ];

  // Generate Day-of Schedule
  const dayOfSchedule = [
    {
      time: '13:00',
      endTime: '15:00',
      activity: 'Venue Access & Decorator Setup',
      owner: 'Lead Coordinator & Decor Team',
      notes: 'Stage backdrop assembly, floral installations, seating arrangement.',
    },
    {
      time: '15:00',
      endTime: '16:00',
      activity: 'Caterer Dispatch & Sound Testing',
      owner: 'Catering Supervisor & Audio Tech',
      notes: 'Food warmers activated, cordless microphone frequency check.',
    },
    {
      time: '16:00',
      endTime: '17:00',
      activity: 'Guest Welcoming & Refreshment Counter',
      owner: 'Reception Committee',
      notes: 'Welcome drinks, guest registration, seating guidance.',
    },
    {
      time: '17:00',
      endTime: '19:00',
      activity: 'Primary Event Ceremonies & Program',
      owner: 'Emcee & Organizers',
      notes: 'Formal proceedings, speeches, honors, and entertainment.',
    },
    {
      time: '19:00',
      endTime: '21:00',
      activity: 'Dinner Service & Social Networking',
      owner: 'Catering Team',
      notes: 'Buffet lines open, background ambient playlist.',
    },
    {
      time: '21:00',
      endTime: '22:00',
      activity: 'Wrap-Up, Teardown & Venue Handover',
      owner: 'Event Lead',
      notes: 'Final equipment checkout, deposit inspection, hall lockup.',
    },
  ];

  const assumptions = [
    `Total plan generated for ${guestCount} guests in ${city} with a budget of ₹${totalBudget.toLocaleString('en-IN')}.`,
    `A strict ${contingencyPercent}% contingency reserve has been reserved deterministically.`,
    setting === 'outdoor' ? 'Outdoor venue assumes fair weather; weather tent buffer recommended.' : 'Indoor venue assumes standard HVAC and lighting.',
  ];

  const identifiedRisks = [
    guestCount > 250 ? 'Large guest count requires strict registration and catering queue management.' : 'Ensure RSVPs are confirmed 7 days in advance.',
    'Vendor contracts must specify exact overtime and setup window terms.',
  ];

  return {
    themeConcept,
    paletteSuggestions: palette,
    budgetCategories,
    tasks,
    vendorChecklist,
    dayOfSchedule,
    assumptions,
    identifiedRisks,
  };
}
