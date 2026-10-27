import React, { useState } from 'react';
import { EventPlan, Vendor, QuoteStatus, BookingStatus } from '@/types';
import { formatINR } from '@/lib/currency';
import { 
  Store, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  FileText, 
  Sparkles, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface VendorManagerTabProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const VendorManagerTab: React.FC<VendorManagerTabProps> = ({
  event,
  onUpdateEvent,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unbooked' | 'confirmed' | 'pending_quote'>('all');
  const [selectedVendorForInspection, setSelectedVendorForInspection] = useState<string | null>(null);
  const [isAddingVendor, setIsAddingVendor] = useState<boolean>(false);

  // New Vendor Form State
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Catering');
  const [newContact, setNewContact] = useState<string>('');
  const [newQuoteAmount, setNewQuoteAmount] = useState<number>(0);
  const [newQuoteStatus, setNewQuoteStatus] = useState<QuoteStatus>('pending');
  const [newBookingStatus, setNewBookingStatus] = useState<BookingStatus>('unbooked');
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newInclusions, setNewInclusions] = useState<string>('');
  const [newExclusions, setNewExclusions] = useState<string>('');

  // AI Negotiation Suggestions generator state
  const [generatingTipsForId, setGeneratingTipsForId] = useState<string | null>(null);
  const [generatedTips, setGeneratedTips] = useState<Record<string, string[]>>({});

  const handleAddVendor = () => {
    if (!newName.trim()) return;

    const newVendor: Vendor = {
      id: `vendor-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      contact: newContact.trim(),
      quotedAmount: Math.max(0, newQuoteAmount),
      quoteStatus: newQuoteStatus,
      bookingStatus: newBookingStatus,
      depositPaid: Math.max(0, newDeposit),
      balanceDue: Math.max(0, newQuoteAmount - newDeposit),
      servicesIncluded: newInclusions.split(',').map(s => s.trim()).filter(Boolean),
      exclusions: newExclusions.split(',').map(s => s.trim()).filter(Boolean),
      setupTransportCharges: 0,
      taxAmount: 0,
      cancellationTerms: 'Standard vendor cancellation terms apply',
      notes: '',
      relatedTaskIds: [],
      isVerifiedByUser: true,
      quoteDetails: {
        baseAmount: newQuoteAmount,
        taxesIncluded: true,
        setupIncluded: true,
        transportIncluded: true,
        staffMealsIncluded: false,
      },
    };

    onUpdateEvent({
      ...event,
      vendors: [...event.vendors, newVendor],
    });

    setNewName('');
    setNewContact('');
    setNewQuoteAmount(0);
    setNewDeposit(0);
    setNewInclusions('');
    setNewExclusions('');
    setIsAddingVendor(false);
  };

  const handleUpdateBookingStatus = (vendorId: string, status: BookingStatus) => {
    const updated = event.vendors.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          bookingStatus: status,
        };
      }
      return v;
    });

    onUpdateEvent({
      ...event,
      vendors: updated,
    });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = event.vendors.filter(v => v.id !== vendorId);
    onUpdateEvent({
      ...event,
      vendors: updated,
    });
  };

  const handleGenerateNegotiationTips = async (vendor: Vendor) => {
    setGeneratingTipsForId(vendor.id);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userMessage: `Give me 3 concrete, professional negotiation questions for my ${vendor.category} quote of ₹${vendor.quotedAmount.toLocaleString('en-IN')}.`,
          eventContext: {
            name: event.name,
            type: event.type,
            totalBudget: event.totalBudget,
            guestCount: event.guestCount,
            city: event.city,
            criticalBlockers: [],
          },
        }),
      });

      const res = await response.json();
      const tipsText = res.reply || '';
      const parsedTips = tipsText.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()));
      
      setGeneratedTips(prev => ({
        ...prev,
        [vendor.id]: parsedTips.length > 0 ? parsedTips : [
          `Ask for setup and teardown hours to be included in base rate.`,
          `Request 50% payment split: 25% deposit, 50% day-of, 25% post-completion inspection.`,
          `Inquire if dietary buffer plates (10%) are complimentary.`,
        ],
      }));
    } catch (err) {
      setGeneratedTips(prev => ({
        ...prev,
        [vendor.id]: [
          `Ask whether generator backup and teardown fees are included in quoted amount.`,
          `Request explicit terms on overtime surcharges after scheduled cutoff.`,
          `Check if tasting sessions or sample trials are complimentary.`,
        ],
      }));
    } finally {
      setGeneratingTipsForId(null);
    }
  };

  const filteredVendors = event.vendors.filter(v => {
    if (activeFilter === 'unbooked') return v.bookingStatus !== 'confirmed';
    if (activeFilter === 'confirmed') return v.bookingStatus === 'confirmed';
    if (activeFilter === 'pending_quote') return v.quoteStatus === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950">Vendor Manager & Quote Inspector</h2>
          <p className="text-xs text-navy-600">Track contracts, inspect hidden cost omissions, and compare actual quotations.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ivory-300 bg-white p-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeFilter === 'all' ? 'bg-emerald-700 text-white' : 'text-navy-700 hover:bg-ivory-100'}`}
            >
              All ({event.vendors.length})
            </button>
            <button
              onClick={() => setActiveFilter('unbooked')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeFilter === 'unbooked' ? 'bg-emerald-700 text-white' : 'text-navy-700 hover:bg-ivory-100'}`}
            >
              Unbooked ({event.vendors.filter(v => v.bookingStatus !== 'confirmed').length})
            </button>
            <button
              onClick={() => setActiveFilter('confirmed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeFilter === 'confirmed' ? 'bg-emerald-700 text-white' : 'text-navy-700 hover:bg-ivory-100'}`}
            >
              Confirmed ({event.vendors.filter(v => v.bookingStatus === 'confirmed').length})
            </button>
          </div>

          <button
            onClick={() => setIsAddingVendor(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Add Vendor Form */}
      {isAddingVendor && (
        <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-navy-950">Add Vendor Record</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Vendor / Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Annapurna Feast Caterers"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Service Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300 bg-white"
              >
                <option value="Venue">Venue</option>
                <option value="Catering">Catering & Dining</option>
                <option value="Decoration">Decoration & Stage</option>
                <option value="Photography">Photography & Video</option>
                <option value="Sound & Lights">Sound & AV Lighting</option>
                <option value="Entertainment">Entertainment & Artists</option>
                <option value="Transportation">Transportation & Logistics</option>
                <option value="Security">Security & Facilities</option>
              </select>
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Contact Phone / Email</label>
              <input
                type="text"
                placeholder="e.g. +91 98230 11223 (Mr. Suresh)"
                value={newContact}
                onChange={e => setNewContact(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Quoted Price (INR)</label>
              <input
                type="number"
                value={newQuoteAmount}
                onChange={e => setNewQuoteAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Quote Status</label>
              <select
                value={newQuoteStatus}
                onChange={e => setNewQuoteStatus(e.target.value as QuoteStatus)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="received">Quotation Received</option>
                <option value="negotiating">Negotiating</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Booking Status</label>
              <select
                value={newBookingStatus}
                onChange={e => setNewBookingStatus(e.target.value as BookingStatus)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300 bg-white"
              >
                <option value="unbooked">Unbooked / Shortlist</option>
                <option value="hold">Date on Hold</option>
                <option value="confirmed">Contract Signed (Confirmed)</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-navy-700 font-semibold mb-1">Services Included (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Full dinner buffet, cutlery, 6 service staff, chai counter"
                value={newInclusions}
                onChange={e => setNewInclusions(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingVendor(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-navy-600 hover:bg-ivory-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVendor}
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
            >
              Save Vendor Record
            </button>
          </div>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredVendors.map(vendor => {
          const isInspecting = selectedVendorForInspection === vendor.id;
          const tips = generatedTips[vendor.id];
          const isGeneratingTips = generatingTipsForId === vendor.id;

          return (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-ivory-200 shadow-soft overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Strip */}
                <div className="p-5 pb-3 border-b border-ivory-100 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ivory-100 text-navy-700">
                      {vendor.category}
                    </span>
                    <h3 className="font-bold text-base text-navy-950 mt-1">{vendor.name}</h3>
                    {vendor.contact && (
                      <p className="text-xs text-navy-600 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-emerald-700" />
                        <span>{vendor.contact}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-serif font-bold text-lg text-navy-950">
                      {formatINR(vendor.quotedAmount)}
                    </span>
                    <span className={`block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${
                      vendor.bookingStatus === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vendor.bookingStatus === 'hold'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-ivory-200 text-navy-700'
                    }`}>
                      {vendor.bookingStatus}
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-3 text-xs">
                  {/* Financials */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                    <div>
                      <span className="text-[10px] text-navy-500 block">Deposit Paid:</span>
                      <span className="font-semibold text-navy-900">{formatINR(vendor.depositPaid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-navy-500 block">Balance Due:</span>
                      <span className="font-semibold text-navy-900">{formatINR(vendor.balanceDue)}</span>
                    </div>
                  </div>

                  {/* Included Services */}
                  {vendor.servicesIncluded && vendor.servicesIncluded.length > 0 && (
                    <div>
                      <span className="font-bold text-[11px] text-navy-800 uppercase tracking-wider block mb-1">
                        Contracted Scope:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-navy-700">
                        {vendor.servicesIncluded.map((s, idx) => (
                          <li key={idx} className="line-clamp-1">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quote Inspector Drawer */}
                  <div className="pt-2 border-t border-ivory-100">
                    <button
                      onClick={() => setSelectedVendorForInspection(isInspecting ? null : vendor.id)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-emerald-800 hover:text-emerald-950 py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        <span>Quote Inspector & Hidden Fee Audit</span>
                      </span>
                      {isInspecting ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isInspecting && (
                      <div className="mt-3 p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2 text-[11px]">
                        <span className="font-bold text-navy-900 block">Common Omission Checklist:</span>
                        <div className="grid grid-cols-2 gap-1.5 text-navy-700">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Setup/Takedown included</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Transport included</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <HelpCircle size={12} className="text-amber-600" />
                            <span>GST Taxes: Check Invoice</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <HelpCircle size={12} className="text-amber-600" />
                            <span>Overtime rate agreed</span>
                          </div>
                        </div>

                        {/* Negotiation Questions */}
                        <div className="mt-3 pt-2 border-t border-ivory-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-navy-900">AI Negotiation Questions:</span>
                            <button
                              onClick={() => handleGenerateNegotiationTips(vendor)}
                              disabled={isGeneratingTips}
                              className="text-[10px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Sparkles size={11} />
                              <span>{isGeneratingTips ? 'Generating...' : 'Refresh Tips'}</span>
                            </button>
                          </div>
                          {tips ? (
                            <ul className="space-y-1 text-navy-700">
                              {tips.map((t, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span>•</span>
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-navy-500 italic">Click "Refresh Tips" to get targeted negotiation questions.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-ivory-50 border-t border-ivory-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <select
                    value={vendor.bookingStatus}
                    onChange={e => handleUpdateBookingStatus(vendor.id, e.target.value as BookingStatus)}
                    className="text-xs px-2 py-1 rounded border border-ivory-300 bg-white"
                  >
                    <option value="unbooked">Unbooked</option>
                    <option value="hold">On Hold</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  className="p-1.5 text-navy-400 hover:text-red-600 rounded transition-colors"
                  title="Delete Vendor"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
