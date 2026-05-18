"use client";

import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { detectApplicationMethod, generateMailtoLink, generateMapsLink, generateWhatsAppLink, getMethodConfig } from "@/lib/applicationMethods";

interface ApplicationMethodCardProps {
  opportunity: {
    title: string;
    extra_metadata?: { application_method?: string | string[] };
    application_method?: string | string[];
    canonical_link?: string;
    application_url?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_website?: string;
    contact_address?: string;
    contact_whatsapp?: string;
  };
}

export function ApplicationMethodCard({ opportunity }: ApplicationMethodCardProps) {
  const method = detectApplicationMethod(opportunity);
  const config = getMethodConfig(method);
  const contactEmail = opportunity.contact_email;
  const contactPhone = opportunity.contact_phone;
  const contactAddress = opportunity.contact_address;
  const contactWhatsApp = opportunity.contact_whatsapp || contactPhone;
  const applyUrl = opportunity.canonical_link || opportunity.application_url || opportunity.contact_website;
  
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        <span>How to Apply</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
          {config.label}
        </span>
      </h4>
      
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.instructions.map((instruction, idx) => (
          <p key={idx} className="flex items-start gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{idx + 1}.</span>
            <span>{instruction}</span>
          </p>
        ))}
      </div>

      {method === 'email' && contactEmail && (
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Send to:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{contactEmail}</span>
          </div>
        </div>
      )}

      {(method === 'post' || method === 'in_person' || method === 'in-person') && contactAddress && (
        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg mb-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-gray-600 dark:text-gray-400 block mb-1">Address:</span>
              <span className="font-semibold text-gray-900 dark:text-white whitespace-pre-line">{contactAddress}</span>
            </div>
          </div>
        </div>
      )}

      {method === 'phone' && contactPhone && (
        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Call:</span>
            <a href={`tel:${contactPhone}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
              {contactPhone}
            </a>
          </div>
        </div>
      )}

      {method === 'whatsapp' && contactWhatsApp && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle size={16} className="text-emerald-500" />
            <span className="text-gray-600 dark:text-gray-400">WhatsApp:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{contactWhatsApp}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        {method === 'online' && applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
          >
            {config.buttonText} <ExternalLink className="w-4 h-4" />
          </a>
        )}
        
        {method === 'email' && contactEmail && (
          <a
            href={generateMailtoLink(contactEmail, opportunity.title)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Mail className="w-4 h-4" /> {config.buttonText}
          </a>
        )}

        {method === 'whatsapp' && contactWhatsApp && (
          <a
            href={generateWhatsAppLink(contactWhatsApp, opportunity.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            <MessageCircle className="w-4 h-4" /> {config.buttonText}
          </a>
        )}

        {method === 'phone' && contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            <Phone className="w-4 h-4" /> {config.buttonText}
          </a>
        )}

        {(method === 'in_person' || method === 'in-person' || method === 'post') && contactAddress && (
          <a
            href={generateMapsLink(contactAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <MapPin className="w-4 h-4" /> {config.buttonText}
          </a>
        )}
      </div>
    </div>
  );
}
