"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Utensils,
    Scissors,
    Stethoscope,
    Camera,
    Coffee,
    Dumbbell,
    Car,
    Dog,
    Cake,
    ShoppingBag,
    Palette,
    Music,
    Wrench,
    Flower2,
    GraduationCap,
    Sparkles,
    Heart,
    Home,
    Plane,
    Baby,
    Shirt,
    Pizza,
    Wine,
    Bike,
    Gem,
    BookOpen,
    Laptop,
    Briefcase,
    Star,
    type LucideIcon,
} from "lucide-react";

// All business icons for the grid
const allIcons: { icon: LucideIcon; label: string; color: string }[] = [
    { icon: Coffee, label: "Café", color: "text-amber-500" },
    { icon: Dumbbell, label: "Gym", color: "text-red-500" },
    { icon: Pizza, label: "Pizza", color: "text-orange-500" },
    { icon: Wine, label: "Bar", color: "text-purple-500" },
    { icon: Bike, label: "Bikes", color: "text-green-500" },
    { icon: ShoppingBag, label: "Retail", color: "text-pink-500" },
    { icon: Cake, label: "Bakery", color: "text-rose-400" },
    { icon: Music, label: "Music", color: "text-indigo-500" },
    { icon: Dog, label: "Pets", color: "text-amber-600" },
    { icon: Flower2, label: "Florist", color: "text-pink-400" },
    { icon: Car, label: "Auto", color: "text-slate-600" },
    { icon: Palette, label: "Art", color: "text-cyan-500" },
    { icon: Wrench, label: "Repair", color: "text-gray-500" },
    { icon: GraduationCap, label: "Tutor", color: "text-blue-500" },
    { icon: Heart, label: "Spa", color: "text-rose-500" },
    { icon: Home, label: "Clean", color: "text-emerald-500" },
    { icon: Plane, label: "Travel", color: "text-sky-500" },
    { icon: Baby, label: "Kids", color: "text-yellow-500" },
    { icon: Shirt, label: "Tailor", color: "text-violet-500" },
    { icon: Gem, label: "Beauty", color: "text-fuchsia-500" },
    { icon: BookOpen, label: "Books", color: "text-teal-500" },
    { icon: Laptop, label: "Tech", color: "text-blue-600" },
    { icon: Briefcase, label: "Legal", color: "text-slate-500" },
    { icon: Star, label: "Events", color: "text-yellow-400" },
];

// Featured use cases - Photographer is tier-based
const featuredCases = [
    {
        id: "restaurant",
        icon: Utensils,
        title: "Restaurant",
        subtitle: "Digital menu",
        gradient: "from-orange-500 to-red-500",
        bg: "bg-gradient-to-br from-orange-50 to-red-50",
        type: "list" as const,
        items: [
            { name: "Caesar Salad", price: "€8" },
            { name: "Pasta Carbonara", price: "€12" },
            { name: "Grilled Steak", price: "€22" },
            { name: "Tiramisu", price: "€6" },
        ],
    },
    {
        id: "salon",
        icon: Scissors,
        title: "Hair Salon",
        subtitle: "Service prices",
        gradient: "from-pink-500 to-rose-500",
        bg: "bg-gradient-to-br from-pink-50 to-rose-50",
        type: "list" as const,
        items: [
            { name: "Haircut", price: "€15" },
            { name: "Coloring", price: "€45" },
            { name: "Treatment", price: "€25" },
            { name: "Styling", price: "€20" },
        ],
    },
    {
        id: "dentist",
        icon: Stethoscope,
        title: "Dentist",
        subtitle: "Treatment costs",
        gradient: "from-cyan-500 to-blue-500",
        bg: "bg-gradient-to-br from-cyan-50 to-blue-50",
        type: "list" as const,
        items: [
            { name: "Check-up", price: "€30" },
            { name: "Cleaning", price: "€40" },
            { name: "Filling", price: "€50" },
            { name: "Whitening", price: "€150" },
        ],
    },
    {
        id: "photographer",
        icon: Camera,
        title: "Photographer",
        subtitle: "Packages",
        gradient: "from-violet-500 to-purple-600",
        bg: "bg-gradient-to-br from-violet-50 to-purple-50",
        type: "tiers" as const,
        tiers: [
            { name: "Basic", price: "€80", highlight: false },
            { name: "Pro", price: "€150", highlight: true },
            { name: "Premium", price: "€280", highlight: false },
        ],
    },
];

// Small icon with hover color effect
function GridIcon({ icon: Icon, label, color, muted = true }: { icon: LucideIcon; label: string; color: string; muted?: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center p-1.5 transition-all duration-200 cursor-default group`}>
            <Icon 
                className={`w-5 h-5 transition-colors duration-200 ${muted ? 'text-slate-300 group-hover:' + color : 'text-slate-400 group-hover:' + color}`} 
                strokeWidth={1.5} 
            />
            <span className={`text-[8px] mt-0.5 font-medium transition-colors duration-200 ${muted ? 'text-slate-300 group-hover:text-slate-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {label}
            </span>
        </div>
    );
}

// Featured card with different layouts
function FeaturedCard({ data, isHovered, onHover }: { 
    data: typeof featuredCases[0]; 
    isHovered: boolean;
    onHover: (id: string | null) => void;
}) {
    const Icon = data.icon;
    
    return (
        <motion.div
            className={`relative h-full rounded-xl overflow-hidden ${data.bg} border ${isHovered ? 'border-slate-200 shadow-lg' : 'border-white/50 shadow-md'} transition-all cursor-pointer flex flex-col`}
            onMouseEnter={() => onHover(data.id)}
            onMouseLeave={() => onHover(null)}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Preview area - no mac buttons, more space */}
            <div className={`bg-gradient-to-r ${data.gradient} p-2 flex-1`}>
                <div className="bg-white/95 rounded-lg p-2 shadow-sm h-full flex flex-col justify-center">
                    {data.type === "list" ? (
                        // List layout for restaurant, salon, dentist
                        <div className="space-y-1">
                            {data.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-[9px] py-0.5 border-b border-slate-100 last:border-0">
                                    <span className="text-slate-600">{item.name}</span>
                                    <span className={`font-bold bg-gradient-to-r ${data.gradient} bg-clip-text text-transparent`}>{item.price}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Tier layout for photographer (like pricing page) - same height as lists
                        <div className="flex gap-1.5 h-full">
                            {data.tiers?.map((tier, i) => (
                                <div 
                                    key={i} 
                                    className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg ${tier.highlight ? `bg-gradient-to-b ${data.gradient} text-white shadow-md` : 'bg-slate-50/80'}`}
                                >
                                    <div className={`text-[9px] font-bold mb-1 ${tier.highlight ? 'text-white/90' : 'text-slate-500'}`}>{tier.name}</div>
                                    <div className={`text-sm font-bold ${tier.highlight ? 'text-white' : `bg-gradient-to-r ${data.gradient} bg-clip-text text-transparent`}`}>{tier.price}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Title area */}
            <div className="px-2 py-1.5 flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${data.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-3 h-3 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-[11px] leading-tight">{data.title}</h3>
                    <p className="text-[8px] text-slate-500">{data.subtitle}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function UseCasesGrid() {
    const [hovered, setHovered] = useState<string | null>(null);

    const cols = 8;
    const rows = 6;
    
    const isFeaturedCell = (col: number, row: number): number | null => {
        if (col >= 2 && col < 4 && row >= 1 && row < 3) return 0;
        if (col >= 4 && col < 6 && row >= 1 && row < 3) return 1;
        if (col >= 2 && col < 4 && row >= 3 && row < 5) return 2;
        if (col >= 4 && col < 6 && row >= 3 && row < 5) return 3;
        return null;
    };
    
    const isFeaturedTopLeft = (col: number, row: number): number | null => {
        if (col === 2 && row === 1) return 0;
        if (col === 4 && row === 1) return 1;
        if (col === 2 && row === 3) return 2;
        if (col === 4 && row === 3) return 3;
        return null;
    };

    return (
        <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-200/50 text-[10px] font-bold mb-3 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-cyan-500" />
                        <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">For every business</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                        One tool, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">endless possibilities</span>
                    </h2>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto">
                        From restaurants to salons, dentists to photographers — create a professional price list for your business.
                    </p>
                </div>

                {/* ClickUp-style Grid with visible grid lines */}
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div 
                        className="grid"
                        style={{ 
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gridTemplateRows: 'repeat(6, minmax(50px, auto))'
                        }}
                    >
                        {Array.from({ length: rows }).map((_, row) =>
                            Array.from({ length: cols }).map((_, col) => {
                                const cellIndex = row * cols + col;
                                const featuredCardIndex = isFeaturedCell(col, row);
                                const isTopLeft = isFeaturedTopLeft(col, row);
                                
                                // Grid lines: right border except last col, bottom border except last row
                                const borderClasses = `
                                    ${col < cols - 1 ? 'border-r border-slate-100' : ''}
                                    ${row < rows - 1 ? 'border-b border-slate-100' : ''}
                                `;
                                
                                // If this is part of a featured card but not top-left, render empty cell with no borders
                                if (featuredCardIndex !== null && isTopLeft === null) {
                                    return (
                                        <div 
                                            key={`empty-${cellIndex}`}
                                            className="bg-transparent"
                                            style={{ gridColumn: col + 1, gridRow: row + 1 }}
                                        />
                                    );
                                }
                                
                                // If this is top-left of featured card, render the card spanning 2x2
                                if (isTopLeft !== null) {
                                    return (
                                        <div 
                                            key={`featured-${isTopLeft}`}
                                            className="p-2 z-10"
                                            style={{ 
                                                gridColumn: `${col + 1} / span 2`, 
                                                gridRow: `${row + 1} / span 2` 
                                            }}
                                        >
                                            <FeaturedCard
                                                data={featuredCases[isTopLeft]}
                                                isHovered={hovered === featuredCases[isTopLeft].id}
                                                onHover={setHovered}
                                            />
                                        </div>
                                    );
                                }
                                
                                // Regular icon cell with grid borders
                                const iconIndex = cellIndex % allIcons.length;
                                const iconData = allIcons[iconIndex];
                                const isEdge = col === 0 || col === 7 || row === 0 || row === 5;
                                
                                return (
                                    <div 
                                        key={`icon-${cellIndex}`} 
                                        className={`flex items-center justify-center ${borderClasses}`}
                                    >
                                        <GridIcon 
                                            icon={iconData.icon} 
                                            label={iconData.label}
                                            color={iconData.color}
                                            muted={isEdge}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs mt-6">...and many more industries</p>
            </div>
        </section>
    );
}
