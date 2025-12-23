'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    HelpCircle,
    Zap,
    CreditCard,
    Calculator,
    Code2,
    ArrowLeft,
    LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useT } from '@/i18n/client';

// --- Types ---

type Category = 'general' | 'features' | 'pricing' | 'technical';

interface FAQItem {
    id: string;
    question: string;
    answer: React.ReactNode;
    category: Category;
}

// --- Data: Calculator SaaS FAQs ---

const faqs: FAQItem[] = [
    // GENERAL
    {
        id: 'what-is-tierless',
        category: 'general',
        question: 'What exactly is Tierless?',
        answer: 'Tierless is a visual editor that lets you create beautiful, mobile-friendly price lists and digital menus in minutes. Think of it as a specialized website builder designed strictly for services and products. You can share your page via a link, a QR code, or embed it directly into your existing website.'
    },
    {
        id: 'need-website',
        category: 'general',
        question: 'Do I need a website if I have Tierless?',
        answer: 'Not necessarily. For many businesses like salons, freelancers, or pop-up cafes, a Tierless page serves as your primary "Link in Bio" or website. It includes your branding, contact info, and services. However, if you already have a website, Tierless acts as a powerful plugin to handle your pricing section.'
    },
    {
        id: 'how-customers-see',
        category: 'general',
        question: 'How do my customers see my prices?',
        answer: 'You can print a unique QR code (provided in your dashboard) and place it on your tables or counter. Customers scan it with their phone camera to instantly view your live menu. You can also share the URL on social media or Instagram stories.'
    },
    // PRICING
    {
        id: 'is-free',
        category: 'pricing',
        question: 'Is Tierless really free?',
        answer: 'Yes, we offer a Free Forever plan. It allows you to create up to 3 drafts and keep 1 page public/live at a time. The free plan is limited to 15 items per list and includes a small "Powered by Tierless" badge. It\'s perfect for small price lists or testing the platform.'
    },
    {
        id: 'item-limit',
        category: 'pricing',
        question: 'Why can\'t I add more than 15 items on the Free plan?',
        answer: 'The Free plan is designed for simple use cases (like a "Top Services" list). For full restaurant menus or extensive agency catalogs, our Starter or Growth plans unlock up to 100+ items and remove the item limit entirely on higher tiers.'
    },
    {
        id: 'draft-vs-public',
        category: 'pricing',
        question: 'What is the difference between a "Draft" and a "Public" page?',
        answer: (
            <div>
                <p className="mb-2"><strong>Draft:</strong> A page you are working on. Only you can see it.</p>
                <p><strong>Public:</strong> A published page accessible to the world.</p>
                <p className="mt-3 text-sm">Note: Your plan determines how many pages can be Public simultaneously. For example, the Starter plan allows 3 public pages (e.g., "Breakfast Menu," "Lunch Menu," and "Drinks").</p>
            </div>
        )
    },
    // FEATURES
    {
        id: 'custom-domain',
        category: 'features',
        question: 'Can I use my own domain name (e.g., menu.mycafe.com)?',
        answer: 'Yes! Custom domains are available on the Pro Plan. This removes the tierless.net branding from your URL entirely, making it look fully professional.'
    },
    {
        id: 'ai-scan',
        category: 'features',
        question: 'I have a photo of my menu. Do I have to type everything manually?',
        answer: 'No! On the Starter plan and above, you can use our AI Scan (OCR) feature. Simply upload a photo of your existing physical menu, and our system will automatically extract the items and prices into the editor for you.'
    },
    {
        id: 'remove-badge',
        category: 'features',
        question: 'Can I remove the "Powered by Tierless" badge?',
        answer: 'Yes. Upgrading to the Growth Plan or higher allows you to remove all Tierless branding, giving you a completely white-label experience.'
    },
    {
        id: 'teams',
        category: 'features',
        question: 'Can I invite my staff to update prices?',
        answer: 'Yes. We support Teams. You can invite members with different roles (like "Editor" or "Viewer"). This is perfect for allowing managers to update daily specials without giving them full ownership of the account.'
    },
    {
        id: 'customize',
        category: 'features',
        question: 'Can I customize the look and feel of my page?',
        answer: 'Absolutely! You can customize colors, fonts, button styles, and layout to match your brand perfectly. Choose from our curated templates or create your own unique design from scratch.'
    },
    {
        id: 'client-workspaces',
        category: 'features',
        question: 'What are Client Workspaces and how do they work?',
        answer: 'Client Workspaces are separate environments for agencies managing multiple clients. Available on the Agency Plan, you can create up to 25 independent workspaces, each with its own team members, pages, and branding. Perfect for design agencies, marketing firms, or consultants who manage menus for multiple businesses.'
    },
    // TECHNICAL
    {
        id: 'embed',
        category: 'technical',
        question: 'How do I embed my price list on my WordPress/Wix/Squarespace site?',
        answer: 'If you are on the Growth Plan, you will see an "Embed Code" option in the publishing menu. Copy this snippet and paste it into any HTML block on your website. Your prices will update automatically on your site whenever you edit them in Tierless.'
    },
    {
        id: 'password-reset',
        category: 'technical',
        question: 'I forgot my password. How do I reset it?',
        answer: 'Tierless uses Passwordless Login (Magic Links). You never need to remember a password. Simply enter your email on the login page, and we will send you a secure link. Click it, and you are instantly logged in.'
    },
    {
        id: 'payments',
        category: 'technical',
        question: 'Does Tierless handle payments or bookings?',
        answer: 'Currently, Tierless is a showcase platform. We help you present your prices professionally. While we don\'t process credit card payments directly for your services yet, you can add "Book Now" buttons to your pages that link to your existing booking system or WhatsApp.'
    },
    {
        id: 'mobile-friendly',
        category: 'technical',
        question: 'Are my pages mobile-friendly?',
        answer: 'Yes! All pages are fully responsive and optimized for mobile, tablet, and desktop. Your customers will have a seamless experience on any device, especially when scanning QR codes with their phones.'
    },
    {
        id: 'webhooks',
        category: 'technical',
        question: 'What are Webhooks and how can I use them?',
        answer: (
            <div>
                <p className="mb-2">Webhooks are automatic notifications that Tierless sends to your server whenever something happens on your pages.</p>
                <p className="mb-2"><strong>Available events:</strong></p>
                <ul className="list-disc list-inside mb-3 text-sm">
                    <li><strong>Page View</strong> — Get notified when someone views your menu (includes country, device type)</li>
                    <li><strong>Rating</strong> — Get notified when someone leaves a star rating</li>
                </ul>
                <p className="mb-2"><strong>Use cases:</strong></p>
                <ul className="list-disc list-inside mb-3 text-sm">
                    <li>Get Slack/Discord alerts when your menu is viewed</li>
                    <li>Log views to Google Sheets via Zapier or Make.com</li>
                    <li>Sync data to your CRM or analytics dashboard</li>
                </ul>
                <p className="text-sm">Webhooks are available on Pro plan and above. Configure them in Dashboard → Integrations → Webhooks.</p>
            </div>
        )
    }
];

// --- Components ---

const CategoryButton = ({
    active,
    onClick,
    icon: Icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${active
            ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const AccordionItem = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => {
    return (
        <div id={item.id} className="border-b border-slate-200 last:border-0 scroll-mt-32">
            <button
                onClick={onClick}
                className="flex items-center justify-between w-full py-5 text-left group focus:outline-none"
            >
                <span className={`text-lg font-semibold transition-colors duration-200 ${isOpen ? 'text-cyan-600' : 'text-slate-900 group-hover:text-cyan-600'
                    }`}>
                    {item.question}
                </span>
                <span className={`ml-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-cyan-600' : 'text-slate-400 group-hover:text-cyan-600'
                        }`} />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="pb-6 text-slate-600 leading-relaxed">
                    {item.answer}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export default function FAQPage() {
    const t = useT();
    const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const { authenticated } = useAuthStatus();

    // Handle anchor links (e.g., /faq#ai-scan)
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const idx = faqs.findIndex(f => f.id === hash);
            if (idx >= 0) {
                setOpenIndex(idx);
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }, []);

    const filteredFaqs = activeCategory === 'all'
        ? faqs
        : faqs.filter(f => f.category === activeCategory);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-20 sm:pt-24 sm:pb-24">
                {/* Back Navigation */}
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{t("faq.backToHome")}</span>
                    </Link>
                    {authenticated && (
                        <>
                            <span className="text-slate-300">•</span>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors group">
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="font-medium">{t("faq.dashboard")}</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* Header Section - Compact, no redundant icon */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 mb-3">
                        {t("faq.title")}
                    </h1>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        {t("faq.subtitle")}
                    </p>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    <CategoryButton
                        active={activeCategory === 'all'}
                        onClick={() => setActiveCategory('all')}
                        icon={HelpCircle}
                        label={t("faq.categories.all")}
                    />
                    <CategoryButton
                        active={activeCategory === 'general'}
                        onClick={() => setActiveCategory('general')}
                        icon={Zap}
                        label={t("faq.categories.general")}
                    />
                    <CategoryButton
                        active={activeCategory === 'features'}
                        onClick={() => setActiveCategory('features')}
                        icon={Calculator}
                        label={t("faq.categories.features")}
                    />
                    <CategoryButton
                        active={activeCategory === 'pricing'}
                        onClick={() => setActiveCategory('pricing')}
                        icon={CreditCard}
                        label={t("faq.categories.pricing")}
                    />
                    <CategoryButton
                        active={activeCategory === 'technical'}
                        onClick={() => setActiveCategory('technical')}
                        icon={Code2}
                        label={t("faq.categories.technical")}
                    />
                </div>

                {/* FAQ List - No animations for better scroll performance */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg">
                    {filteredFaqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            item={faq}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                        />
                    ))}

                    {filteredFaqs.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            {t("faq.noQuestions")}
                        </div>
                    )}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-slate-600 mb-6 text-lg">
                        {t("faq.ctaQuestion")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="mailto:contact@tierless.net"
                            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                            {t("faq.contactSupport")}
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                        >
                            {t("faq.goToDashboard")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}