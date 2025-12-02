"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { GripVertical, Sparkles, Coffee, Utensils, Pizza } from "lucide-react";

export default function MockEditor() {
    const initialServices = [
        { id: "1", icon: Pizza, name: "Margherita Pizza", price: "$12", color: "bg-red-50", iconColor: "text-red-600" },
        { id: "2", icon: Utensils, name: "Grilled Salmon", price: "$24", color: "bg-orange-50", iconColor: "text-orange-600" },
        { id: "3", icon: Coffee, name: "Cappuccino", price: "$4.50", color: "bg-amber-50", iconColor: "text-amber-700" },
        { id: "4", icon: Sparkles, name: "Chef's Special", price: "$32", color: "bg-purple-50", iconColor: "text-purple-600" },
    ];

    const [services, setServices] = useState(initialServices);

    return (
        <div className="w-full flex items-start justify-start">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-2 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-slate-600" />
                        <div className="text-xs font-semibold text-slate-700">Your Menu</div>
                    </div>
                </div>

                {/* Service List - Draggable */}
                <Reorder.Group
                    axis="y"
                    values={services}
                    onReorder={setServices}
                    className="p-3 space-y-2 bg-gradient-to-b from-slate-50/50 to-white list-none"
                >
                    {services.map((service) => (
                        <Reorder.Item
                            key={service.id}
                            value={service}
                            layout
                            className="group relative bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md hover:border-slate-300 transition-shadow cursor-grab active:cursor-grabbing"
                            whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 10 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            <div className="flex items-center gap-2.5">
                                {/* Drag Handle */}
                                <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />

                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-lg ${service.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                    <service.icon className={`w-4 h-4 ${service.iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-900 truncate">{service.name}</div>
                                </div>

                                {/* Price Badge */}
                                <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-bold flex-shrink-0">
                                    {service.price}
                                </div>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                {/* Footer hint */}
                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-medium">Drag to reorder</span>
                </div>
            </div>
        </div>
    );
}
