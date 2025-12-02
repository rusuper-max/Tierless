```
"use client";

import { motion } from "framer-motion";
import { GripVertical, Plus, Trash2 } from "lucide-react";

export default function MockEditor() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            {/* Header Dots */}
            <div className="flex gap-1.5 mb-6">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>

            {/* Skeleton Items */}
            <div className="space-y-3">
                {/* Item 1 */}
                <div className="h-12 w-full bg-slate-50 rounded-lg animate-pulse" style={{ animationDelay: "0s" }} />
                
                {/* Item 2 (Highlighted/Active) */}
                <div className="h-12 w-full bg-indigo-50/50 rounded-lg border border-indigo-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>

                {/* Item 3 */}
                <div className="h-12 w-[80%] bg-slate-50 rounded-lg animate-pulse" style={{ animationDelay: "0.2s" }} />
            </div>
        </div>
    </div>
  );
}
```
