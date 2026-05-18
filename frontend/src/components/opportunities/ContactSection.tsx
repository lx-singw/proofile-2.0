"use client";

import { ExternalLink, Globe, Mail, MessageCircle, Phone } from "lucide-react";

interface ContactSectionProps {
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    application_url?: string;
    whatsapp?: string;
    fax?: string;
  };
  extra_metadata?: {
    spider_contacts?: {
      emails?: string[];
      phones?: string[];
    };
  };
}

export function ContactSection({ contact, extra_metadata }: ContactSectionProps) {
  if (!contact?.phone && !contact?.email && !contact?.website && !contact?.application_url && 
      !extra_metadata?.spider_contacts?.emails?.length && !extra_metadata?.spider_contacts?.phones?.length) {
    return (
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        Contact information not available. Apply through the official source.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contact?.phone && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-gray-900 dark:text-white">{contact.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${contact.phone}`}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Call
            </a>
            <a 
              href={`https://wa.me/${contact.phone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
      
      {contact?.email && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-gray-900 dark:text-white">{contact.email}</span>
          </div>
          <a 
            href={`mailto:${contact.email}`}
            className="px-3 py-1.5 text-xs font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Email
          </a>
        </div>
      )}

      {contact?.website && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{contact.website}</span>
          </div>
          <a 
            href={contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold border border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
          >
            Visit
          </a>
        </div>
      )}

      {contact?.application_url && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ExternalLink size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium px-1 text-gray-900 dark:text-white">Application Page</span>
          </div>
          <a 
            href={contact.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Apply Link
          </a>
        </div>
      )}

      {extra_metadata?.spider_contacts?.emails && extra_metadata.spider_contacts.emails.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium px-1">Regional/Department Emails:</p>
          <div className="grid grid-cols-1 gap-2">
            {extra_metadata.spider_contacts.emails
              .filter((email: string) => email !== contact?.email)
              .map((email: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{email}</span>
                </div>
                <a 
                  href={`mailto:${email}`}
                  className="px-2 py-1 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Email
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
