import React from "react";
import { motion } from "framer-motion";
import {
    X, Palette, Type, Layout, Coins, MessageCircle,
    Send, Mail, Phone, MapPin, Globe, Link2,
    Camera, Trash2, Upload, Sparkles, Image as ImageIcon, Star, Lock
} from "lucide-react";

import { Button, InlineInput, InlineTextarea } from "./shared";
import { COLORS, CURRENCY_PRESETS, FONT_OPTIONS, t } from "./constants";
import type { AdvancedTheme, BillingPeriod } from "./types";
import { LOCKED_STYLES, type LockedStyle } from "@/data/calcTemplates";

interface AdvancedSettingsPanelProps {
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;

    // State from useAdvancedState
    advancedPublicTheme: AdvancedTheme;
    setAdvancedPublicTheme: (v: AdvancedTheme) => void;
    advancedColumnsDesktop: number;
    setAdvancedColumnsDesktop: (v: number) => void;
    advancedPublicTitle: string;
    setAdvancedPublicTitle: (v: string) => void;
    advancedPublicSubtitle: string;
    setAdvancedPublicSubtitle: (v: string) => void;

    // Store access
    calc: any; // Using any for now to match usage, ideally CalcJson
    updateCalc: (recipe: (draft: any) => void) => void;

    // Derived state passed down
    currency: string;
    setCurrency: (c: string) => void;

    // Contact helpers
    selectedContactType: string;
    contactOverride: any;
    overrideWhatsapp: string;
    overrideEmail: string;
    updateContactOverride: (patch: any) => void;

    // Upload refs
    pendingUploadNodeId: React.MutableRefObject<string | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function AdvancedSettingsPanel({
    showSettings,
    setShowSettings,
    advancedPublicTheme,
    setAdvancedPublicTheme,
    advancedColumnsDesktop,
    setAdvancedColumnsDesktop,
    advancedPublicTitle,
    setAdvancedPublicTitle,
    advancedPublicSubtitle,
    setAdvancedPublicSubtitle,
    calc,
    updateCalc,
    currency,
    setCurrency,
    selectedContactType,
    contactOverride,
    overrideWhatsapp,
    overrideEmail,
    updateContactOverride,
    pendingUploadNodeId,
    fileInputRef,
}: AdvancedSettingsPanelProps) {
    if (!showSettings) return null;

    // Check if this is a premium locked template
    const isLocked = calc?.meta?.templateLocked === true;
    const templateStyleId = calc?.meta?.templateStyleId as string | undefined;
    const lockedStyle: LockedStyle | undefined = templateStyleId ? LOCKED_STYLES[templateStyleId] : undefined;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-[var(--bg)] overflow-y-auto"
        >
            <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text)]">{t("Page Settings")}</h2>
                        <p className="text-sm text-[var(--muted)] mt-1">{t("Configure your tier-based pricing page")}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(false)} className="gap-2">
                        <X className="w-4 h-4" /> {t("Close")}
                    </Button>
                </div>

                {/* 🔒 Premium Template Banner */}
                {isLocked && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                                    ✨ {t("Premium Template")}
                                </h3>
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    {t("This template has a locked visual style. You can edit all content (tiers, prices, descriptions) but the design theme is fixed to maintain its premium look.")}
                                </p>
                                {lockedStyle && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                                            Theme: {lockedStyle.theme}
                                        </span>
                                        <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                                            Font: {lockedStyle.fontFamily.split(",")[0].replace(/'/g, "")}
                                        </span>
                                        <span className="px-2 py-1 text-[10px] font-medium rounded-full border" style={{ borderColor: lockedStyle.accentColor, color: lockedStyle.accentColor }}>
                                            Accent: {lockedStyle.accentColor}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* APPEARANCE CARD */}
                    <div className={`p-6 rounded-2xl border bg-[var(--card)] space-y-5 ${isLocked ? "border-amber-500/30 relative overflow-hidden" : "border-[var(--border)]"}`}>
                        {/* Locked overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 bg-[var(--bg)]/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                                <Lock className="w-8 h-8 text-amber-500 mb-2" />
                                <span className="text-sm font-medium text-[var(--muted)]">{t("Style locked by template")}</span>
                            </div>
                        )}
                        
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <Palette className="w-4 h-4 text-cyan-500" /> {t("Appearance")}
                            {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                        </h3>

                        {/* Theme */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text)]">{t("Page Theme")}</label>
                            <p className="text-[10px] text-[var(--muted)]">{t("Theme for the public page view")}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {["light", "dark", "tierless"].map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => !isLocked && setAdvancedPublicTheme(theme as any)}
                                        disabled={isLocked}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${advancedPublicTheme === theme
                                            ? "bg-cyan-500 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                            : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-cyan-400"
                                            } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                                <Type className="w-3.5 h-3.5" /> {t("Font Style")}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {FONT_OPTIONS.map(font => {
                                    const currentFont = (calc?.meta as any)?.publicFont || "sans";
                                    return (
                                        <button
                                            key={font.value}
                                            onClick={() => !isLocked && updateCalc((draft) => {
                                                if (!draft.meta) draft.meta = {};
                                                (draft.meta as any).publicFont = font.value;
                                            })}
                                            disabled={isLocked}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${font.preview} ${currentFont === font.value
                                                ? "bg-cyan-500 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                                : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-cyan-400"
                                                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            {font.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Columns */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                                <Layout className="w-3.5 h-3.5" /> {t("Grid Columns")}
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => !isLocked && setAdvancedColumnsDesktop(n)}
                                        disabled={isLocked}
                                        className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${advancedColumnsDesktop === n
                                            ? "bg-cyan-500 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                            : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-cyan-400"
                                            } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PRICING CARD */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <Coins className="w-4 h-4 text-cyan-500" /> {t("Pricing")}
                        </h3>

                        {/* Currency */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text)]">{t("Currency Symbol")}</label>
                            <div className="grid grid-cols-5 gap-2">
                                {CURRENCY_PRESETS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`h-10 text-sm rounded-lg border transition-all ${currency === c
                                            ? "bg-cyan-500 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                            : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-cyan-400"
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                placeholder={t("Custom currency...")}
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-500 text-[var(--text)] mt-2"
                            />
                        </div>
                    </div>

                    {/* CONTACT & INQUIRY CARD */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-cyan-500" /> {t("Inquiry Contact")}
                        </h3>

                        <p className="text-xs text-[var(--muted)]">{t("Choose how customers can reach you for inquiries.")}</p>

                        <div className="grid grid-cols-3 gap-2">
                            {["whatsapp", "telegram", "email"].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => {
                                        if (mode === "whatsapp") {
                                            updateContactOverride({ type: "whatsapp", telegram: null, email: null });
                                        } else if (mode === "telegram") {
                                            updateContactOverride({ type: "telegram", whatsapp: null, email: null });
                                        } else {
                                            updateContactOverride({ type: "email", whatsapp: null, telegram: null });
                                        }
                                    }}
                                    className={`px-3 py-2.5 text-sm rounded-lg border transition-all ${selectedContactType === mode
                                        ? "bg-cyan-500 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                        : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-cyan-400"
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                        {selectedContactType === "whatsapp" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("WhatsApp number")}</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="tel"
                                        value={overrideWhatsapp}
                                        onChange={(e) => updateContactOverride({ whatsapp: e.target.value })}
                                        placeholder="+15551234567"
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                    />
                                </div>
                                <p className="text-[10px] text-[var(--muted)]">{t("Enter full international number without spaces.")}</p>
                            </div>
                        )}

                        {selectedContactType === "telegram" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Telegram username")}</label>
                                <div className="relative">
                                    <Send className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="text"
                                        value={contactOverride.telegram || ""}
                                        onChange={(e) => updateContactOverride({ telegram: e.target.value })}
                                        placeholder="username"
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                    />
                                </div>
                                <p className="text-[10px] text-[var(--muted)]">{t("Enter your username without the @ symbol.")}</p>
                            </div>
                        )}

                        {selectedContactType === "email" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Email address")}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="email"
                                        value={overrideEmail}
                                        onChange={(e) => updateContactOverride({ email: e.target.value })}
                                        placeholder="orders@example.com"
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Account Confirmation */}
                        <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-400 transition-colors mt-4">
                            <div className="space-y-0.5">
                                <span className="text-sm text-[var(--text)] font-medium block">{t("Confirm Account")}</span>
                                <span className="text-[10px] text-[var(--muted)] block">{t("I confirm this is my contact information")}</span>
                            </div>
                            <div className="relative inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={(calc?.meta as any)?.contactConfirmed || false}
                                    onChange={e => updateCalc((draft) => {
                                        if (!draft.meta) draft.meta = {};
                                        (draft.meta as any).contactConfirmed = e.target.checked;
                                    })}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${(calc?.meta as any)?.contactConfirmed ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-300"}`}></div>
                            </div>
                        </label>
                    </div>

                    {/* BUSINESS INFO CARD */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5">
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-500" /> {t("Business Info")}
                        </h3>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Phone Number")}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="text"
                                        value={(calc?.meta as any)?.business?.phone || ""}
                                        onChange={(e) => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            if (!(draft.meta as any).business) (draft.meta as any).business = {};
                                            (draft.meta as any).business.phone = e.target.value;
                                        })}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Location (Google Maps)")}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="text"
                                        value={(calc?.meta as any)?.business?.location || ""}
                                        onChange={(e) => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            if (!(draft.meta as any).business) (draft.meta as any).business = {};
                                            (draft.meta as any).business.location = e.target.value;
                                        })}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                        placeholder="https://goo.gl/maps/..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Website URL")}</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="text"
                                        value={(calc?.meta as any)?.business?.social?.website || ""}
                                        onChange={(e) => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            if (!(draft.meta as any).business) (draft.meta as any).business = {};
                                            if (!(draft.meta as any).business.social) (draft.meta as any).business.social = {};
                                            (draft.meta as any).business.social.website = e.target.value;
                                        })}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Portfolio Link")}</label>
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-3 text-[var(--muted)]" size={16} />
                                    <input
                                        type="text"
                                        value={(calc?.meta as any)?.portfolioUrl || ""}
                                        onChange={(e) => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            (draft.meta as any).portfolioUrl = e.target.value;
                                        })}
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:border-cyan-500 outline-none pl-10 text-[var(--text)]"
                                        placeholder="https://myportfolio.com"
                                    />
                                </div>
                                <p className="text-[10px] text-[var(--muted)]">{t("Link to your portfolio or work samples")}</p>
                            </div>
                        </div>
                    </div>

                    {/* BRANDING & MEDIA CARD */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5 lg:col-span-2">
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <Camera className="w-4 h-4 text-cyan-500" /> {t("Branding & Media")}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Logo")}</label>
                                {(calc?.meta as any)?.logoUrl ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] h-24 flex items-center justify-center">
                                        <img src={(calc?.meta as any)?.logoUrl} alt="Logo" className="max-h-20 max-w-full object-contain" />
                                        <button
                                            onClick={() => updateCalc((draft) => { if (draft.meta) (draft.meta as any).logoUrl = null; })}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            pendingUploadNodeId.current = "__logo__";
                                            fileInputRef.current?.click();
                                        }}
                                        className="w-full h-24 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1 hover:border-cyan-400 transition-colors text-[var(--muted)]"
                                    >
                                        <Upload className="w-5 h-5" />
                                        <span className="text-[10px]">{t("Upload Logo")}</span>
                                    </button>
                                )}
                            </div>

                            {/* Hero Image Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Hero Image")}</label>
                                {(calc?.meta as any)?.heroImageUrl ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] h-24">
                                        <img src={(calc?.meta as any)?.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => updateCalc((draft) => { if (draft.meta) (draft.meta as any).heroImageUrl = null; })}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            pendingUploadNodeId.current = "__hero__";
                                            fileInputRef.current?.click();
                                        }}
                                        className="w-full h-24 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1 hover:border-cyan-400 transition-colors text-[var(--muted)]"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span className="text-[10px]">{t("Upload Hero")}</span>
                                    </button>
                                )}
                                <p className="text-[10px] text-[var(--muted)]">{t("Displayed at the top of page")}</p>
                            </div>

                            {/* Background Image Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--muted)]">{t("Background")}</label>
                                {(calc?.meta as any)?.backgroundImageUrl ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] h-24">
                                        <img src={(calc?.meta as any)?.backgroundImageUrl} alt="Background" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => updateCalc((draft) => { if (draft.meta) (draft.meta as any).backgroundImageUrl = null; })}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            pendingUploadNodeId.current = "__background__";
                                            fileInputRef.current?.click();
                                        }}
                                        className="w-full h-24 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1 hover:border-cyan-400 transition-colors text-[var(--muted)]"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-[10px]">{t("Upload Background")}</span>
                                    </button>
                                )}
                                <p className="text-[10px] text-[var(--muted)]">{t("Semi-transparent overlay applied")}</p>
                            </div>
                        </div>
                    </div>

                    {/* VISIBILITY & FEATURES CARD */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-5 lg:col-span-2">
                        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
                            <Star className="w-4 h-4 text-cyan-500" /> {t("Visibility & Features")}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Allow Rating */}
                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-400 transition-colors">
                                <div className="space-y-0.5 flex-1 pr-4">
                                    <span className="text-sm text-[var(--text)] font-medium block">{t("Allow Rating")}</span>
                                    <span className="text-[10px] text-[var(--muted)] block">{t("Let visitors rate your page")}</span>
                                </div>
                                <div className="relative inline-flex items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={(calc?.meta as any)?.allowRating || false}
                                        onChange={e => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            (draft.meta as any).allowRating = e.target.checked;
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${(calc?.meta as any)?.allowRating ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-300"}`}></div>
                                </div>
                            </label>

                            {/* Show in Examples */}
                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-400 transition-colors">
                                <div className="space-y-0.5 flex-1 pr-4">
                                    <span className="text-sm text-[var(--text)] font-medium block">{t("Show in Examples")}</span>
                                    <span className="text-[10px] text-[var(--muted)] block">{t("Feature in public gallery")}</span>
                                </div>
                                <div className="relative inline-flex items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={(calc?.meta as any)?.listInExamples || false}
                                        onChange={e => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            (draft.meta as any).listInExamples = e.target.checked;
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${(calc?.meta as any)?.listInExamples ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-300"}`}></div>
                                </div>
                            </label>

                            {/* Show Powered by Badge */}
                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-400 transition-colors">
                                <div className="space-y-0.5 flex-1 pr-4">
                                    <span className="text-sm text-[var(--text)] font-medium block">{t("Powered by Badge")}</span>
                                    <span className="text-[10px] text-[var(--muted)] block">{t("Show Tierless attribution")}</span>
                                </div>
                                <div className="relative inline-flex items-center shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={(calc?.meta as any)?.advancedShowBadge !== false}
                                        onChange={e => updateCalc((draft) => {
                                            if (!draft.meta) draft.meta = {};
                                            (draft.meta as any).advancedShowBadge = e.target.checked;
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${(calc?.meta as any)?.advancedShowBadge !== false ? "bg-gradient-to-r from-[#4F46E5] to-[#22D3EE]" : "bg-gray-300"}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
