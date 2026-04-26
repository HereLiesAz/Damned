import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  ChevronRight, 
  HelpCircle, 
  Command, 
  Circle, 
  Terminal,
  Activity,
  AlertTriangle
} from 'lucide-react';

// --- Types ---

export interface AzNavItemProps {
  id: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  subItems?: AzNavItemProps[];
}

// --- Components ---

/**
 * AzLoad: A dramatic, minimalist loading animation
 */
export const AzLoad = () => (
  <div className="flex flex-col items-center justify-center p-8 gap-4">
    <div className="relative w-12 h-12">
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-white/20 rounded-full"
      />
      <motion.div 
        animate={{ 
          rotate: -360,
          scale: [1.2, 1, 1.2],
          opacity: [1, 0.5, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 border-2 border-white rounded-full flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
      </motion.div>
    </div>
    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono animate-pulse">
      Negotiating with the Abyss...
    </p>
  </div>
);

/**
 * AzRoller: A scrolling ticker / status indicator
 */
export const AzRoller = ({ messages }: { messages: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="h-4 overflow-hidden border-t border-b border-white/5 bg-black/40 px-2 flex items-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

/**
 * AzTextBox: Styled input for the despair aesthetic
 */
export const AzTextBox = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="group space-y-1">
    <label className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-mono block transition-colors group-focus-within:text-white">
      {label}
    </label>
    <div className="relative">
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border-l-2 border-zinc-800 p-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-white transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-zinc-800 rounded-full" />
    </div>
  </div>
);

/**
 * AzNavRail: The main container
 */
export const AzNavRail = ({ 
  items, 
  activeId, 
  onSelect,
  header,
  footer
}: { 
  items: AzNavItemProps[]; 
  activeId: string; 
  onSelect: (id: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <nav className="w-16 md:w-20 bg-zinc-950 border-r border-white/10 flex flex-col items-center py-6 gap-6 relative z-50 overflow-visible">
      {header && <div className="mb-4">{header}</div>}

      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const hasSubs = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id} className="relative group w-full px-2">
              <button
                onClick={() => {
                  if (hasSubs) {
                    setExpandedId(isExpanded ? null : item.id);
                  } else {
                    onSelect(item.id);
                  }
                }}
                className={`
                  relative w-full aspect-square md:aspect-[5/4] rounded-lg flex flex-col items-center justify-center gap-1 transition-all
                  ${isActive ? 'bg-white/5 border border-white/20 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-tighter opacity-60">
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    layoutId="rail-active-indicator"
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r shadow-[0_0_10px_white]"
                  />
                )}

                {hasSubs && (
                  <div className={`absolute bottom-1 right-1 transition-transform ${isExpanded ? 'rotate-90 text-white' : 'text-zinc-800'}`}>
                    <ChevronRight className="w-2 h-2" />
                  </div>
                )}
              </button>

              {/* Sub-menu (Hierarchical Navigation) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-[calc(100%+8px)] top-0 bg-zinc-950 border border-white/10 p-2 rounded-lg shadow-2xl min-w-[120px] z-[100]"
                  >
                    <div className="text-[8px] text-zinc-500 uppercase tracking-widest mb-2 px-2 pb-2 border-b border-white/5">
                      {item.label} // Subordinates
                    </div>
                    {item.subItems?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onSelect(sub.id);
                          setExpandedId(null);
                        }}
                        className={`
                          w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-[10px] uppercase font-mono transition-colors
                          ${activeId === sub.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
                        `}
                      >
                        {sub.label}
                        <sub.icon className="w-3 h-3 opacity-40" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 border-t border-white/5 pt-6 w-full">
        {footer}
      </div>
    </nav>
  );
};
