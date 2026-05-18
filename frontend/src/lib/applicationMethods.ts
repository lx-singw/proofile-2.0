/**
 * Application Method Utilities
 * Handles different application channels with appropriate UI and instructions
 */

export type ApplicationMethod = 
  | 'online' 
  | 'email' 
  | 'post' 
  | 'in_person' 
  | 'in-person'
  | 'whatsapp' 
  | 'fax'
  | 'phone'
  | string;

export interface ApplicationMethodConfig {
  label: string;
  icon: string;
  buttonText: string;
  color: string;
  instructions: string[];
}

export const APPLICATION_METHODS: Record<string, ApplicationMethodConfig> = {
  online: {
    label: 'Online Application',
    icon: '🌐',
    buttonText: 'Apply Now',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    instructions: [
      'Click the "Apply Now" button below to be redirected to the application portal.',
      'Complete the application form with your personal details.',
      'Upload required documents (CV, certificates, ID copy).',
      'Review your application carefully before submitting.',
    ],
  },
  email: {
    label: 'Email Application',
    icon: '📧',
    buttonText: 'Apply via Email',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    instructions: [
      'Click the button below to open your email client.',
      'Attach your CV and supporting documents.',
      'Include the job title in your email subject line.',
      'Write a brief cover letter in the email body.',
      'Double-check the recipient email before sending.',
    ],
  },
  post: {
    label: 'Postal Application',
    icon: '📮',
    buttonText: 'View Mailing Address',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    instructions: [
      'Prepare your application documents (CV, certified copies, cover letter).',
      'Address your envelope to the postal address provided.',
      'Use registered mail for tracking purposes.',
      'Keep copies of all documents for your records.',
      'Allow 5-7 business days for delivery.',
    ],
  },
  in_person: {
    label: 'In-Person Application',
    icon: '🏢',
    buttonText: 'Get Directions',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    instructions: [
      'Visit the physical address during business hours.',
      'Bring original documents and certified copies.',
      'Dress professionally for potential on-site interview.',
      'Ask for reception or HR department upon arrival.',
      'Collect proof of application submission.',
    ],
  },
  'in-person': {
    label: 'In-Person Application',
    icon: '🏢',
    buttonText: 'Get Directions',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    instructions: [
      'Visit the physical address during business hours.',
      'Bring original documents and certified copies.',
      'Dress professionally for potential on-site interview.',
      'Ask for reception or HR department upon arrival.',
      'Collect proof of application submission.',
    ],
  },
  whatsapp: {
    label: 'WhatsApp Application',
    icon: '💬',
    buttonText: 'Apply via WhatsApp',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    instructions: [
      'Click the button to open WhatsApp.',
      'Send a professional greeting with the job title.',
      'Share your CV as a PDF document.',
      'Include your contact details in the message.',
      'Wait for confirmation of receipt.',
    ],
  },
  phone: {
    label: 'Phone Application',
    icon: '📞',
    buttonText: 'Call to Apply',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    instructions: [
      'Call during business hours (typically 8am-5pm).',
      'Have the job reference number ready.',
      'Prepare to discuss your qualifications briefly.',
      'Ask about next steps and required documents.',
      'Note down any reference numbers provided.',
    ],
  },
  fax: {
    label: 'Fax Application',
    icon: '📠',
    buttonText: 'View Fax Number',
    color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    instructions: [
      'Prepare your application documents.',
      'Include a cover page with the job title and your contact details.',
      'Fax to the number provided.',
      'Keep the transmission confirmation.',
      'Follow up via phone or email after 2-3 days.',
    ],
  },
};

export function getMethodConfig(method: ApplicationMethod | undefined): ApplicationMethodConfig {
  if (!method || typeof method !== 'string') {
    return APPLICATION_METHODS.online;
  }
  
  const normalizedMethod = method.toLowerCase().replace(/[\s_-]+/g, '_');
  return APPLICATION_METHODS[normalizedMethod] || APPLICATION_METHODS[method] || APPLICATION_METHODS.online;
}

export function detectApplicationMethod(opportunity: {
  extra_metadata?: { application_method?: string | string[] };
  application_method?: string | string[];
  canonical_link?: string;
  application_url?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_website?: string;
  contact_address?: string;
  contact_whatsapp?: string;
}): ApplicationMethod {
  const explicitMethod = opportunity.extra_metadata?.application_method || opportunity.application_method;
  if (explicitMethod) {
    return Array.isArray(explicitMethod) ? explicitMethod[0] : explicitMethod;
  }
  
  if (opportunity.canonical_link || opportunity.application_url || opportunity.contact_website) return 'online';
  if (opportunity.contact_whatsapp) return 'whatsapp';
  if (opportunity.contact_email) return 'email';
  if (opportunity.contact_phone) return 'phone';
  if (opportunity.contact_address) return 'in_person';
  
  return 'online';
}

export function generateMailtoLink(email: string, jobTitle: string): string {
  const subject = encodeURIComponent(`Application: ${jobTitle}`);
  return `mailto:${email}?subject=${subject}`;
}

export function generateWhatsAppLink(phone: string, jobTitle: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const message = encodeURIComponent(`Hi, I'm interested in applying for: ${jobTitle}`);
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export function generateMapsLink(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function getBestApplicationUrl(opportunity: {
  canonical_link?: string;
  application_url?: string;
  contact_website?: string;
  source_url?: string;
}): string | null {
  return opportunity.canonical_link 
    || opportunity.application_url 
    || opportunity.contact_website 
    || opportunity.source_url 
    || null;
}
