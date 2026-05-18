"use client";

import { Check, Copy, Mail, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    id: number;
    title: string;
    company_name: string;
  };
}

export function ShareModal({ isOpen, onClose, opportunity }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/opportunities/${opportunity?.id}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-green-500',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this opportunity: ${opportunity?.title}\n${shareUrl}`)}`, '_blank')
    },
    { 
      name: 'Email', 
      icon: Mail, 
      color: 'bg-blue-500',
      action: () => window.open(`mailto:?subject=${encodeURIComponent(opportunity?.title)}&body=${encodeURIComponent(`Check out this opportunity:\n${shareUrl}`)}`, '_blank')
    },
    { 
      name: 'Copy Link', 
      icon: copied ? Check : Copy, 
      color: 'bg-gray-500',
      action: handleCopy
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share Opportunity</h3>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{opportunity?.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{opportunity?.company_name}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:border-emerald-500/40"
                >
                  <div className={`p-3 rounded-full ${option.color} text-white`}>
                    <option.icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{option.name}</span>
                </button>
              ))}
            </div>

            {copied && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
              >
                <Check size={16} /> Link copied to clipboard!
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
