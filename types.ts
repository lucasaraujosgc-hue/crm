
export enum Status {
  SUCCESS = 'Sucesso',
  ERROR = 'Erro',
  PENDING = 'Pendente',
  PROCESSING = 'Processando'
}

export enum CampaignStatus {
  PENDING = 'pending',     // Not contacted yet
  QUEUED = 'queued',       // In sending queue
  SENT = 'sent',           // Message sent
  DELIVERED = 'delivered', // Double check
  READ = 'read',           // Blue tick
  REPLIED = 'replied',     // Customer answered
  INTERESTED = 'interested', // Lead conversion
  NOT_INTERESTED = 'not_interested' // Lead lost
}

export interface CompanyResult {
  id: string;
  inscricaoEstadual: string;
  cnpj: string;
  razaoSocial: string;
  municipio: string;
  telefone: string | null;
  situacaoCadastral: string;
  motivoSituacao: string; // This is the KEY key for the Knowledge Base
  nomeContador: string | null;
  status: Status;
  
  // Campaign Fields
  campaignStatus: CampaignStatus;
  lastContacted?: string; // ISO Date
  lastMessageSent?: string;
  aiAnalysis?: string;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  success: number;
  errors: number;
}

export interface KnowledgeRule {
  id: string;
  motivoSituacao: string; // Links directly to the scraped data
  diagnosis: string;      // "O que é isso?" (Context for AI)
  solution: string;       // "O que precisa ser feito?" (Technical solution)
  salesPitch: string;     // "Como vender isso?" (Persuasion)
  isActive: boolean;
}

export interface AIConfig {
  model: string;
  persona: string;
  knowledgeRules: KnowledgeRule[];
  temperature: number;
  aiActive: boolean; // Master switch for AI on WhatsApp
}

export interface WhatsAppSession {
  status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting';
  qrCode?: string; // Base64 string
  userName?: string;
  phoneNumber?: string;
}