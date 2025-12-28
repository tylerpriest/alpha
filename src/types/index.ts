import {
  User,
  Organization,
  Document,
  Deal,
  Conversation,
  Message,
  PortfolioCompany,
  Fund,
  Activity,
  UserRole,
  DealStage,
  DocumentType,
  DocumentStatus,
  ConversationType,
  OrganizationType,
  SubscriptionTier,
} from '@prisma/client';

// Re-export enums
export {
  UserRole,
  DealStage,
  DocumentType,
  DocumentStatus,
  ConversationType,
  OrganizationType,
  SubscriptionTier,
};

// Extended types with relations
export interface UserWithOrgs extends User {
  memberships: {
    organization: Organization;
    role: UserRole;
  }[];
}

export interface DocumentWithMeta extends Document {
  uploadedBy: Pick<User, 'id' | 'name' | 'image'>;
  tags?: { tag: { id: string; name: string; color: string } }[];
  chunkCount: number;
}

export interface DealWithRelations extends Deal {
  leadPartner?: Pick<User, 'id' | 'name' | 'image'> | null;
  fund?: Pick<Fund, 'id' | 'name'> | null;
  documents?: { document: DocumentWithMeta; category?: string }[];
  contacts?: DealContact[];
  _count?: {
    documents: number;
    comments: number;
    conversations: number;
  };
}

export interface DealContact {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  isPrimary: boolean;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  user: Pick<User, 'id' | 'name' | 'image'>;
}

export interface PortfolioWithMetrics extends PortfolioCompany {
  fund?: Pick<Fund, 'id' | 'name'> | null;
  investments: {
    id: string;
    round: string;
    investedAmount: number;
    valuation?: number;
    ownership: number;
    investedDate: Date;
    currentValue?: number;
    moic?: number;
  }[];
  latestMetrics?: {
    revenue?: number;
    arr?: number;
    mrr?: number;
    employees?: number;
    runway?: number;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search types
export interface SearchResult {
  id: string;
  type: 'document' | 'deal' | 'portfolio' | 'conversation';
  title: string;
  description?: string;
  score: number;
  highlights?: string[];
  metadata?: Record<string, unknown>;
}

export interface SemanticSearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  metadata: {
    title: string;
    pageNumber?: number;
    section?: string;
  };
}

// AI/Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceReference[];
  createdAt: Date;
}

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  pageNumber?: number;
  relevanceScore: number;
}

export interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  risks?: string[];
  recommendations?: string[];
  confidence: number;
}

// Dashboard types
export interface DashboardStats {
  totalDocuments: number;
  activeDeals: number;
  portfolioCompanies: number;
  totalAUM: number;
  monthlyQueries: number;
  storageUsed: number;
}

export interface DealPipelineStats {
  stage: DealStage;
  count: number;
  totalValue: number;
}

export interface ActivityItem extends Activity {
  user?: Pick<User, 'id' | 'name' | 'image'>;
}

// Form types
export interface DocumentUploadInput {
  title: string;
  description?: string;
  type: DocumentType;
  folderId?: string;
  tags?: string[];
  file: File;
}

export interface DealCreateInput {
  name: string;
  companyName: string;
  website?: string;
  industry?: string;
  sector?: string;
  location?: string;
  description?: string;
  source: string;
  askAmount?: number;
  preMoneyVal?: number;
  fundId?: string;
  leadPartnerId?: string;
}

export interface DealUpdateInput extends Partial<DealCreateInput> {
  stage?: DealStage;
  investmentThesis?: string;
  risks?: string;
  passReason?: string;
}

// Filter types
export interface DocumentFilters {
  type?: DocumentType[];
  status?: DocumentStatus[];
  folderId?: string;
  collectionId?: string;
  tagIds?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DealFilters {
  stages?: DealStage[];
  fundId?: string;
  leadPartnerId?: string;
  industry?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

// Subscription types
export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  limits: {
    storage: number;
    queries: number;
    users: number;
    documents: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}
