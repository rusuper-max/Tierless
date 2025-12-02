"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Bell,
  Building,
  Zap,
  BarChart3,
  Mail,
  Phone,
  Globe,
  Save,
  Loader2,
  Trash2,
  ExternalLink,
  Languages,
  Coins,
  MessageCircle
} from 'lucide-react';
import { useLocale } from '@/i18n/LanguageProvider';
import { useDashboardTranslation } from '@/i18n/useDashboardTranslation';
import { useAccount } from '@/hooks/useAccount';
import { ENTITLEMENTS } from '@/lib/entitlements';
import { Button } from '@/components/ui/Button';

// --- MOCK DATA for business details (to be replaced with real data later) ---
const USER_MOCK = {
  email: "user@example.com",
  plan: "starter",
  joinedAt: "Nov 2024",
  businessName: "Bistro Tierless",
  phone: "+1 234 567 890",
  website: "https://bistro.com"
};

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const { locale, setLocale } = useLocale();
  const { t } = useDashboardTranslation();
  const { plan, renewsOn, cancelAtPeriodEnd } = useAccount();

  // Real usage stats
  const [usageStats, setUsageStats] = useState({
    publishedPages: 0,
    totalPages: 0,
    pagesLimit: 3,
    publishedLimit: 10
  });

  // Fetch real usage data and profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Usage
        const usageRes = await fetch('/api/calculators', {
          cache: 'no-store',
          credentials: 'same-origin'
        });

        if (usageRes.ok) {
          const data = await usageRes.json();
          const rows = Array.isArray(data) ? data : (data.rows || []);

          const publishedPages = rows.reduce((acc: number, r: any) =>
            (r.meta?.published ? acc + 1 : acc), 0
          );

          // Get limits from entitlements
          const limits = ENTITLEMENTS[plan]?.limits as any;
          const pagesLimit = limits?.pages ?? "unlimited";
          const publishedLimit = limits?.maxPublicPages ??
            (typeof pagesLimit === "number" ? pagesLimit : Infinity);

          setUsageStats({
            publishedPages,
            totalPages: rows.length,
            pagesLimit: Number.isFinite(pagesLimit) ? pagesLimit : Infinity,
            publishedLimit: Number.isFinite(publishedLimit) ? publishedLimit : Infinity
          });
        }

        // Fetch Profile
        const profileRes = await fetch('/api/account', {
          cache: 'no-store',
          credentials: 'same-origin'
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          console.log("Loaded profile:", profile); // DEBUG
          if (profile && Object.keys(profile).length > 0) {
            setFormData(prev => ({
              ...prev,
              businessName: profile.business_name ?? "",
              inquiryEmail: profile.inquiry_email ?? "",
              phone: profile.phone ?? "",
              website: profile.website ?? "",
              currency: profile.currency || "USD",
              orderDestination: profile.order_destination || "email",
              whatsapp: profile.whatsapp_number ?? ""
            }));
          }
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [plan]);

  // Form State
  const [formData, setFormData] = useState({
    businessName: "",
    inquiryEmail: "",
    phone: "",
    website: "",
    currency: "USD",
    orderDestination: "email", // email | whatsapp
    whatsapp: ""
  });

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showCancelPlan, setShowCancelPlan] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    try {
      // Simulate API call for now since backend endpoint is not confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Account deleted");
      // Redirect to home or logout
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account", error);
    } finally {
      setDeleteBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log("Saving formData:", formData); // DEBUG
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save');

      // Optional: Show success toast or feedback
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const planLabelKey = `account.billing.planNames.${plan}`;
  const translatedPlanLabel = t(planLabelKey);
  const planLabel = translatedPlanLabel === planLabelKey
    ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : translatedPlanLabel;

  const renewalLabel = useMemo(() => {
    if (!renewsOn) return null;
    try {
      const parsed = new Date(renewsOn);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Intl.DateTimeFormat(locale || "en", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(parsed);
    } catch {
      return null;
    }
  }, [renewsOn, locale]);

  const renewalText = renewalLabel ?? t('account.billing.renewsUnknown');
  const canCancelPlan = plan !== "free";

  const updateCancellation = async (shouldCancel: boolean) => {
    if (!canCancelPlan && shouldCancel) return;
    setCancelBusy(true);
    try {
      const res = await fetch('/api/me/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd: shouldCancel }),
      });
      if (!res.ok) throw new Error('Failed to update plan cancellation');
      window.dispatchEvent(new Event('TL_AUTH_CHANGED'));
      setShowCancelPlan(false);
    } catch (error) {
      console.error('Failed to update plan cancellation', error);
    } finally {
      setCancelBusy(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('account.tabs.general'), icon: Building },
    { id: 'billing', label: t('account.tabs.billing'), icon: CreditCard },
    { id: 'preferences', label: t('account.tabs.preferences'), icon: Bell },
  ];

  return (
    <div className="w-full min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-2">{t('account.title')}</h1>
          <p className="text-[var(--muted)] text-base md:text-lg">{t('account.description')}</p>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl w-fit mb-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'general'
              ? 'bg-[var(--card)] text-[var(--text)] shadow-sm border border-[var(--border)]/50'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
              }`}
          >
            {t('account.tabs.general')}
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'billing'
              ? 'bg-[var(--card)] text-[var(--text)] shadow-sm border border-[var(--border)]/50'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
              }`}
          >
            {t('account.tabs.billing')}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'preferences'
              ? 'bg-[var(--card)] text-[var(--text)] shadow-sm border border-[var(--border)]/50'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
              }`}
          >
            {t('account.tabs.preferences')}
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* --- TAB: GENERAL --- */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Business Details Column */}
              <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t('account.general.title')}</h3>
                  <p className="text-sm text-[var(--muted)] mb-8">{t('account.general.description')}</p>

                  <div className="space-y-6">
                    {/* Business Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.general.businessName')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--brand-1)] focus:border-transparent outline-none transition-all pl-10"
                          placeholder={t('account.general.businessNamePlaceholder')}
                        />
                        <Building className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
                      </div>
                    </div>

                    {/* Inquiry Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.general.inquiryEmail')}</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.inquiryEmail}
                          onChange={(e) => setFormData({ ...formData, inquiryEmail: e.target.value })}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--brand-1)] focus:border-transparent outline-none transition-all pl-10"
                          placeholder={t('account.general.inquiryEmailPlaceholder')}
                        />
                        <Mail className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5 mt-4 md:mt-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.general.phone')}</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--brand-1)] focus:border-transparent outline-none transition-all pl-10"
                        />
                        <Phone className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.general.website')}</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--brand-1)] focus:border-transparent outline-none transition-all pl-10"
                        />
                        <Globe className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end border-t border-[var(--border)] mt-6 md:mt-8">
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      isLoading={loading}
                      variant="brand"
                      icon={<Save size={18} />}
                    >
                      {t('account.general.saveChanges')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Defaults Column */}
              <div className="lg:col-span-1 space-y-8 order-1 lg:order-2">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-[var(--text)] mb-6">{t('account.defaults.title')}</h3>

                  <div className="space-y-6">
                    {/* Language Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <Languages size={12} /> {t('account.defaults.language')}
                      </label>
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as any)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
                      >
                        <option value="en">English</option>
                        <option value="sr">Srpski</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ru">Русский</option>
                      </select>
                    </div>

                    {/* Currency Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <Coins size={12} /> {t('account.defaults.currency')}
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="RSD">RSD (дин.)</option>
                      </select>
                      <p className="text-[10px] text-[var(--muted)]">{t('account.defaults.currencyDescription')}</p>
                    </div>

                    {/* Order Receiving */}
                    <div className="pt-6 border-t border-[var(--border)] space-y-6">
                      <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">{t('account.orders.title')}</h4>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.orders.destination')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setFormData({ ...formData, orderDestination: 'email' })}
                            variant={formData.orderDestination === 'email' ? 'brand' : 'neutral'}
                            className="w-full"
                            icon={<Mail size={14} />}
                          >
                            Email
                          </Button>
                          <Button
                            onClick={() => setFormData({ ...formData, orderDestination: 'whatsapp' })}
                            variant={formData.orderDestination === 'whatsapp' ? 'brand' : 'neutral'}
                            className="w-full"
                            icon={<MessageCircle size={14} />}
                          >
                            WhatsApp
                          </Button>
                        </div>
                      </div>

                      {formData.orderDestination === 'whatsapp' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t('account.orders.whatsappNumber')}</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={formData.whatsapp}
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              placeholder={t('account.orders.whatsappPlaceholder')}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all pl-10"
                            />
                            <MessageCircle className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --- TAB: BILLING --- */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-1 space-y-4 md:space-y-6 order-2 lg:order-1">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 md:p-6 space-y-6">
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <BarChart3 size={16} className="text-[var(--brand-1)]" /> {t('account.billing.usage')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-[var(--muted)]">Total Pages</span>
                        <span className="text-[var(--text)] font-bold">
                          {usageStats.totalPages} / {Number.isFinite(usageStats.pagesLimit) ? usageStats.pagesLimit : '∞'}
                        </span>
                      </div>
                      <div className="relative w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, rgba(var(--brand-1-rgb, 79, 70, 229), 0.1) 0%, rgba(var(--brand-2-rgb, 34, 211, 238), 0.1) 100%)' }}>
                        <div
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (usageStats.totalPages / (Number.isFinite(usageStats.pagesLimit) ? usageStats.pagesLimit : 100)) * 100)}%`,
                            background: 'linear-gradient(90deg, var(--brand-1, #4F46E5) 0%, var(--brand-2, #22D3EE) 100%)'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-[var(--muted)]">Published Pages</span>
                        <span className="text-[var(--text)] font-bold">
                          {usageStats.publishedPages} / {Number.isFinite(usageStats.publishedLimit) ? usageStats.publishedLimit : '∞'}
                        </span>
                      </div>
                      <div className="relative w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, rgba(var(--brand-1-rgb, 79, 70, 229), 0.1) 0%, rgba(var(--brand-2-rgb, 34, 211, 238), 0.1) 100%)' }}>
                        <div
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (usageStats.publishedPages / (Number.isFinite(usageStats.publishedLimit) ? usageStats.publishedLimit : 100)) * 100)}%`,
                            background: 'linear-gradient(90deg, var(--brand-1, #4F46E5) 0%, var(--brand-2, #22D3EE) 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap size={200} />
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">{t('account.billing.currentPlan')}</div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)]">{planLabel}</h2>
                      {plan === "free" ? (
                        <p className="text-[var(--muted)] text-xs md:text-sm max-w-md">{t('account.billing.freePlanInfo')}</p>
                      ) : (
                        <p className="text-[var(--muted)] text-xs md:text-sm max-w-md">
                          {t('account.billing.renewsOn')}{" "}
                          <span className="font-semibold text-[var(--text)]">{renewalText}</span>.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 min-w-[220px] w-full sm:w-auto">
                      <a
                        href="/start"
                        className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[var(--brand-1,#4F46E5)] to-[var(--brand-2,#22D3EE)] px-4 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-2,#22D3EE)]/30 transition-all hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-1,#4F46E5)]"
                      >
                        <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="relative flex items-center gap-2">
                          {t('account.billing.manageSubscription')}
                          <ExternalLink size={14} />
                        </span>
                      </a>
                      {canCancelPlan && !cancelAtPeriodEnd && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setShowCancelPlan(true)}
                            disabled={cancelBusy}
                            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--border)] px-4 text-xs md:text-sm font-semibold text-[var(--text)]/80 transition-colors hover:border-rose-400 hover:text-rose-500 disabled:opacity-60"
                          >
                            {t('account.billing.cancel.cta')}
                          </button>
                          <p className="text-[11px] text-[var(--muted)]">{t('account.billing.cancel.description')}</p>
                        </div>
                      )}
                      {canCancelPlan && cancelAtPeriodEnd && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-100">
                            {t('account.billing.cancel.scheduled')}
                          </p>
                          <p className="text-xs text-amber-700/90 dark:text-amber-100/80">
                            {t('account.billing.cancel.scheduledDescription', { plan: planLabel, date: renewalText })}
                          </p>
                          <button
                            onClick={() => updateCancellation(false)}
                            disabled={cancelBusy}
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-white text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:opacity-60 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
                          >
                            {t('account.billing.cancel.keep')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: SETTINGS (NOTIFICATIONS + DANGER) --- */}
          {activeTab === 'preferences' && (
            <div className="max-w-2xl space-y-6 md:space-y-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-[var(--brand-1)]" /> {t('account.preferences.notifications')}
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'productUpdates', label: t('account.preferences.productUpdates') },
                    { key: 'weeklyReports', label: t('account.preferences.weeklyReports') }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <span className="text-sm text-[var(--text)]">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-[var(--surface)] rounded-full peer peer-checked:bg-[var(--brand-1)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 md:p-6 space-y-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-red-500 mb-2">{t('account.preferences.dangerZone')}</h3>
                  <p className="text-xs md:text-sm text-[var(--muted)]">{t('account.preferences.dangerZoneDescription')}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">{t('account.preferences.deleteAccount')}</h4>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/70 max-w-md">
                      {t('account.preferences.deleteAccountDescription')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    {t('account.preferences.deleteAccount')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <CancelPlanModal
          open={showCancelPlan}
          onCancel={() => setShowCancelPlan(false)}
          onConfirm={() => updateCancellation(true)}
          busy={cancelBusy}
        />

        <ConfirmDeleteAccount
          open={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          busy={deleteBusy}
        />
      </div>
    </div>
  );
}

function CancelPlanModal({
  open,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const { t } = useDashboardTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative z-[101] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-[92vw] max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--text)]">
          {t('account.billing.cancel.modalTitle')}
        </h3>
        <p className="text-sm text-[var(--muted)]">
          {t('account.billing.cancel.modalBody')}
        </p>
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button onClick={onCancel} disabled={busy}>
            {t('account.billing.cancel.modalKeep')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            isLoading={busy}
            variant="danger"
          >
            {t('account.billing.cancel.modalConfirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteAccount({
  open,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const { t } = useDashboardTranslation();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-[101] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-[92vw] max-w-md p-6">
        <h3 className="text-lg font-bold text-[var(--text)]">
          {t('account.deleteModal.title')}
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t('account.deleteModal.description')}
        </p>
        <p className="mt-4 text-sm text-[var(--text)]">
          {t('account.deleteModal.instruction')}
        </p>

        <input
          className="mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
          placeholder={t('account.deleteModal.placeholder')}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
        />

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            onClick={onCancel}
            disabled={busy}
            variant="brand"
          >
            {t('account.deleteModal.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy || typed !== "DELETE FOREVER"}
            variant="danger"
            isLoading={busy}
          >
            {busy ? t('account.deleteModal.deleting') : t('account.deleteModal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
