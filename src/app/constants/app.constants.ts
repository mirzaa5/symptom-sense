export const APP_CONSTANTS = {
  APP_NAME: 'SymptomSense',
  TAGLINE: 'AI-Powered Medical Diagnostic Assistant',
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  ERROR_AUTO_DISMISS_MS: 5000,
};

export const AI_MODELS = {
  MISTRAL: {
    name: 'Mistral Vision',
    apiKey: 'SFDoNcIdekOhrpWpaRTfbVjHnk4yKPYz',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    model: 'pixtral-12b-2409', // Vision-capable model
  },
  GEMINI: {
    name: 'ss-novavox-v1',
    apiKey: 'YOUR_GEMINI_API_KEY',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    model: 'ss-novavox-v1',
  },
  ASHISH: {
    name: 'ss-lumalight-v1',
    apiKey: 'YOUR_ASHISH_API_KEY',
    apiUrl: 'YOUR_ASHISH_API_URL',
    model: 'ss-lumalight-v1',
  },
  AGENTIC: {
    name: 'Agentic Medical Assistant (Local)',
    apiUrl: 'http://localhost:8000/api/process_input',
    model: 'agentic-multi-agent',
    description: 'Local FastAPI backend with RAG, Image Analysis, Web Search, and Confidence Scoring'
  },
};

export const COLORS = {
  PRIMARY: '#2563EB',
  USER_MESSAGE_BG: '#DBEAFE',
  AI_MESSAGE_BG: '#F3F4F6',
  PAGE_BG: '#F9FAFB',
  TEXT: '#111827',
  ERROR: '#EF4444',
};

export const MEDICAL_DISCLAIMER = `⚠️ MEDICAL DISCLAIMER

This AI assistant is NOT a substitute for professional medical advice, diagnosis, or treatment.

• Always consult your physician for medical conditions
• This tool does not provide medical diagnoses
• In emergencies, call your doctor or emergency services immediately

By using this service, you acknowledge these terms.`;

export const PRIVACY_NOTICE = `🔒 PRIVACY NOTICE

• Conversations are temporary and not stored
• Your session expires after 30 minutes of inactivity
• All communication is encrypted (HTTPS)
• Do not share personal identifying information unless necessary`;

export const ERROR_MESSAGES = {
  NETWORK: 'Unable to connect. Please check your internet.',
  IMAGE_SIZE: 'Image must be under 10MB.',
  IMAGE_TYPE: 'Only JPG and PNG images supported.',
  VOICE_NOT_SUPPORTED: 'Voice input not supported in this browser.',
  SESSION_EXPIRED: 'Session expired. Please refresh.',
  API_FAILED: 'Failed to get response. Please try again.',
  EMPTY_MESSAGE: 'Please enter a message.',
};

