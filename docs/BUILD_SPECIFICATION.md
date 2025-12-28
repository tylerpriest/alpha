# AlphaIntel: AI Knowledge Base for VC/PE Firms
## Complete Build Specification for AI Agent

---

## PHASE 0: MANDATORY RESEARCH (Do This First)

Before writing ANY code, you must research and document:

### Market Research
1. **Web search**: "What software do VC firms actually use 2024" - document the tools
2. **Web search**: "PE firm technology stack pain points" - document complaints
3. **Web search**: "Affinity CRM reviews complaints" - understand competitor gaps
4. **Web search**: "Why do VC firms lose institutional knowledge" - understand the real problem
5. **Web search**: "AI for due diligence private equity" - see what's being built

### Competitor Analysis
Research these competitors and document what they do well and poorly:
- Affinity (CRM + relationship intelligence)
- Visible (portfolio monitoring)
- Harmonic (AI company search)
- Hebbia (document AI)
- Chronograph (PE fund admin)

### User Research
Based on your research, document answers to:
1. What are the top 5 daily workflows for a VC associate?
2. What are the top 5 daily workflows for a PE principal?
3. What information do they search for most often?
4. What manual processes waste the most time?
5. What happens when a senior partner leaves a firm?

**DELIVERABLE**: Create `/docs/MARKET_RESEARCH.md` with your findings before proceeding.

---

## PHASE 1: CORE ARCHITECTURE

### Tech Stack (Non-Negotiable)
```
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- PostgreSQL with pgvector extension
- Prisma ORM
- NextAuth.js (credentials + OAuth)
- OpenAI API (embeddings + chat)
- AWS S3 (document storage)
- Redis (queues + caching)
- BullMQ (job processing)
```

### Project Structure
```
/src
  /app                    # Next.js App Router
    /api                  # API routes
    /(auth)              # Public auth pages
    /(dashboard)         # Protected app pages
  /lib
    /ai                  # AI/ML utilities
    /integrations        # External service clients
    /services            # Business logic layer
  /components
    /ui                  # Base components (shadcn)
    /features            # Feature-specific components
  /hooks                 # Custom React hooks
  /types                 # TypeScript types
/workers                 # Background job processors
/docs                    # Documentation
```

### Critical Architecture Rules

1. **NO MOCK DATA IN COMPONENTS**
   - Every component must fetch from real APIs
   - Use React Query/SWR for data fetching
   - Loading states and error boundaries required

2. **SERVICE LAYER PATTERN**
   - API routes call service functions
   - Services contain business logic
   - Services call repositories/Prisma
   - Never put business logic in API routes

3. **REAL ASYNC PROCESSING**
   - Document processing = background job
   - Embedding generation = background job
   - Never block HTTP requests for heavy work

4. **ENVIRONMENT VALIDATION**
   - Validate all env vars at startup
   - Fail fast with clear error messages
   - Use zod for env validation

---

## PHASE 2: DATABASE DESIGN

### Required Tables (Implement All)

```prisma
// Core multi-tenancy
model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  // Subscription
  stripeCustomerId  String?  @unique
  plan              Plan     @default(FREE)
  // Limits (enforced, not decorative)
  documentsLimit    Int      @default(100)
  queriesPerMonth   Int      @default(500)
  queriesUsedThisMonth Int   @default(0)
  queriesResetAt    DateTime?
}

// Documents with REAL vector search
model Document {
  id            String   @id @default(cuid())
  // Storage
  s3Key         String   @unique  // Actual S3 key
  s3Bucket      String
  originalName  String
  mimeType      String
  sizeBytes     Int
  // Processing status (track real state)
  status        DocumentStatus @default(PENDING)
  processingError String?
  // Extracted content
  textContent   String?  @db.Text
  pageCount     Int?
  // Metadata
  documentType  DocumentType
  sourceType    SourceType  // UPLOAD, EMAIL, GDRIVE, etc.
}

// Vector chunks with REAL embeddings
model DocumentChunk {
  id          String   @id @default(cuid())
  documentId  String
  content     String   @db.Text
  // REAL vector - requires pgvector
  embedding   Unsupported("vector(1536)")
  // Retrieval metadata
  chunkIndex  Int
  pageNumber  Int?
  tokenCount  Int

  @@index([embedding], type: Hnsw(ops: VectorCosineOps))
}

// Conversations with REAL history
model Conversation {
  id        String   @id @default(cuid())
  title     String?
  // Context binding
  dealId    String?
  companyId String?
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           Role     // USER, ASSISTANT, SYSTEM
  content        String   @db.Text
  // For assistant messages
  model          String?  // gpt-4-turbo, etc.
  promptTokens   Int?
  completionTokens Int?
  // Source citations (REAL, not fake)
  citations      Json?    // [{chunkId, score, snippet}]
  // Cost tracking
  costCents      Int?
}

// Deal tracking with REAL data
model Deal {
  id              String   @id @default(cuid())
  // Basic info
  companyName     String
  website         String?
  description     String?  @db.Text
  // Stage tracking with HISTORY
  currentStage    DealStage
  stageHistory    DealStageChange[]
  // Financials (nullable - not always known)
  askAmount       Decimal? @db.Decimal(14,2)
  valuation       Decimal? @db.Decimal(14,2)
  // AI analysis (generated, not hardcoded)
  aiSummary       String?  @db.Text
  aiRisks         String[]
  aiScore         Float?   // 0-10, computed not static
  aiScoreReason   String?
  lastAnalyzedAt  DateTime?
}

// Activity log for compliance (REAL audit trail)
model Activity {
  id          String   @id @default(cuid())
  type        ActivityType
  userId      String
  // What was accessed/changed
  entityType  String   // Document, Deal, Conversation
  entityId    String
  // Details
  action      String   // viewed, downloaded, queried, updated
  metadata    Json?
  // Request context
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())

  @@index([organizationId, timestamp])
  @@index([entityType, entityId])
}
```

### Required Database Setup
```sql
-- MUST run this for vector search to work
CREATE EXTENSION IF NOT EXISTS vector;

-- MUST create HNSW index for fast similarity search
CREATE INDEX ON document_chunks
USING hnsw (embedding vector_cosine_ops);
```

---

## PHASE 3: CORE FEATURES (Build In Order)

### 3.1 Authentication (Day 1)

**Requirements:**
- Email/password with proper validation
- Google OAuth
- Organization creation on signup
- Invite system for team members
- Role-based access (Owner, Admin, Member, Viewer)

**Test criteria:**
- [ ] Can register with email
- [ ] Can login with Google
- [ ] Can invite team member by email
- [ ] Invited user joins correct organization
- [ ] Roles are enforced on API routes

### 3.2 Document Upload & Processing (Days 2-4)

**Requirements:**
- Drag-drop upload to S3 (presigned URLs)
- Support: PDF, DOCX, XLSX, PPTX, TXT, MD
- Background processing queue (BullMQ)
- Real text extraction (pdf-parse, mammoth, etc.)
- Chunking with overlap (1000 tokens, 200 overlap)
- Embedding generation (OpenAI ada-002)
- Store vectors in pgvector

**The Processing Pipeline (Must Be Real):**
```typescript
// /workers/document-processor.ts
async function processDocument(job: Job<{documentId: string}>) {
  const doc = await db.document.findUnique({where: {id: job.data.documentId}});

  // 1. Download from S3
  const buffer = await s3.getObject({Bucket: doc.s3Bucket, Key: doc.s3Key});

  // 2. Extract text (REAL extraction, not placeholder)
  const text = await extractText(buffer, doc.mimeType);
  if (!text || text.length < 10) {
    throw new Error('Failed to extract text');
  }

  // 3. Chunk the text
  const chunks = chunkText(text, {maxTokens: 1000, overlap: 200});

  // 4. Generate embeddings (REAL OpenAI call)
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: chunks.map(c => c.content),
  });

  // 5. Store chunks with vectors
  await db.$transaction(
    chunks.map((chunk, i) =>
      db.$executeRaw`
        INSERT INTO document_chunks (id, document_id, content, embedding, chunk_index)
        VALUES (${cuid()}, ${doc.id}, ${chunk.content}, ${embeddings.data[i].embedding}::vector, ${i})
      `
    )
  );

  // 6. Update document status
  await db.document.update({
    where: {id: doc.id},
    data: {status: 'INDEXED', textContent: text}
  });
}
```

**Test criteria:**
- [ ] PDF uploads and extracts real text
- [ ] DOCX uploads and extracts real text
- [ ] Chunks are stored with embeddings
- [ ] Can query chunks by vector similarity
- [ ] Processing errors are captured and shown

### 3.3 Semantic Search (Days 5-6)

**Requirements:**
- Real vector similarity search using pgvector
- Hybrid search (vector + keyword)
- Filtering by document type, date, tags
- Result ranking and scoring

**The Search Query (Must Use pgvector):**
```typescript
// /lib/services/search.ts
async function semanticSearch(query: string, orgId: string, limit = 10) {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Vector similarity search (REAL pgvector query)
  const results = await db.$queryRaw<SearchResult[]>`
    SELECT
      dc.id,
      dc.content,
      dc.document_id,
      d.title,
      d.document_type,
      1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.organization_id = ${orgId}
      AND d.status = 'INDEXED'
    ORDER BY dc.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results.filter(r => r.similarity > 0.7); // Threshold
}
```

**Test criteria:**
- [ ] Search "SaaS metrics" returns relevant chunks
- [ ] Search "revenue growth" finds financial content
- [ ] Results have real similarity scores (not random)
- [ ] Empty query returns helpful error
- [ ] Filters work (date range, doc type)

### 3.4 AI Chat with RAG (Days 7-9)

**Requirements:**
- Real retrieval-augmented generation
- Source citations that link to actual documents
- Conversation memory (last N messages)
- Streaming responses
- Token counting and cost tracking

**The Chat Flow (Must Be Real):**
```typescript
// /lib/services/chat.ts
async function chat(message: string, conversationId: string) {
  // 1. Get conversation history
  const history = await db.message.findMany({
    where: {conversationId},
    orderBy: {createdAt: 'desc'},
    take: 10,
  });

  // 2. Semantic search for relevant context
  const relevantChunks = await semanticSearch(message, orgId, 5);

  // 3. Build prompt with real context
  const systemPrompt = `You are an AI assistant for a ${org.type} firm.

Answer based on the following documents from the firm's knowledge base:

${relevantChunks.map(c => `[${c.title}]: ${c.content}`).join('\n\n')}

If the answer isn't in the provided context, say so. Always cite your sources.`;

  // 4. Call OpenAI (REAL call, not mock)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {role: 'system', content: systemPrompt},
      ...history.reverse().map(m => ({role: m.role, content: m.content})),
      {role: 'user', content: message},
    ],
    stream: true,
  });

  // 5. Stream response and save
  // ... streaming logic ...

  // 6. Save with REAL citations
  await db.message.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: fullResponse,
      citations: relevantChunks.map(c => ({
        chunkId: c.id,
        documentId: c.documentId,
        title: c.title,
        snippet: c.content.slice(0, 200),
        score: c.similarity,
      })),
      model: 'gpt-4-turbo-preview',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    }
  });
}
```

**Test criteria:**
- [ ] Question about uploaded doc returns correct answer
- [ ] Citations link to real document chunks
- [ ] "I don't know" when answer not in docs
- [ ] Conversation history is maintained
- [ ] Token usage is tracked

### 3.5 Deal Flow Management (Days 10-12)

**Requirements:**
- Full CRUD for deals
- Kanban board with drag-drop stage changes
- Stage change history tracking
- Document attachment to deals
- AI-generated deal summary and risk analysis

**AI Deal Analysis (Must Be Real):**
```typescript
// /lib/services/deal-analysis.ts
async function analyzeDeal(dealId: string) {
  const deal = await db.deal.findUnique({
    where: {id: dealId},
    include: {documents: {include: {document: true}}}
  });

  // Get content from attached documents
  const context = await Promise.all(
    deal.documents.map(async d => {
      const chunks = await db.documentChunk.findMany({
        where: {documentId: d.documentId},
        take: 5,
      });
      return chunks.map(c => c.content).join('\n');
    })
  );

  // Generate real analysis
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'system',
      content: `Analyze this investment opportunity. Provide:
        1. Executive summary (2-3 sentences)
        2. Key strengths (bullet points)
        3. Key risks (bullet points)
        4. Score 1-10 with reasoning

        Company: ${deal.companyName}
        Description: ${deal.description}

        Documents:
        ${context.join('\n\n')}`
    }],
  });

  // Parse and save
  const parsed = parseAnalysis(analysis.choices[0].message.content);
  await db.deal.update({
    where: {id: dealId},
    data: {
      aiSummary: parsed.summary,
      aiRisks: parsed.risks,
      aiScore: parsed.score,
      aiScoreReason: parsed.scoreReason,
      lastAnalyzedAt: new Date(),
    }
  });
}
```

**Test criteria:**
- [ ] Can create deal with all fields
- [ ] Drag-drop stage change works and logs history
- [ ] Can attach documents to deal
- [ ] AI analysis generates real insights
- [ ] Score changes when new docs added

### 3.6 Portfolio Tracking (Days 13-14)

**Requirements:**
- Company profiles with metrics history
- Investment tracking (rounds, ownership, valuations)
- Computed returns (MOIC, IRR)
- Metric update workflow

**Metric Calculations (Must Be Real):**
```typescript
// /lib/services/portfolio.ts
function calculateMOIC(invested: number, currentValue: number): number {
  return currentValue / invested;
}

function calculateIRR(cashFlows: {date: Date, amount: number}[]): number {
  // Newton-Raphson method for IRR
  // ... real implementation ...
}

async function getPortfolioSummary(orgId: string) {
  const companies = await db.portfolioCompany.findMany({
    where: {organizationId: orgId},
    include: {investments: true, metrics: {orderBy: {date: 'desc'}, take: 1}}
  });

  return companies.map(c => ({
    ...c,
    totalInvested: c.investments.reduce((s, i) => s + i.amount, 0),
    currentValue: c.currentValue, // From latest valuation
    moic: calculateMOIC(totalInvested, currentValue),
    irr: calculateIRR(c.investments.map(i => ({date: i.date, amount: -i.amount}))),
  }));
}
```

---

## PHASE 4: DIFFERENTIATING FEATURES

### 4.1 Email Integration (Week 3)
- Connect Gmail/Outlook
- Auto-extract contacts and relationships
- Link emails to deals/companies
- This is what makes Affinity valuable - build it

### 4.2 Automated Data Collection (Week 3)
- Carta integration for cap tables
- Bank feed integration for portfolio metrics
- This removes manual data entry pain

### 4.3 Meeting Intelligence (Week 4)
- Calendar integration
- Meeting transcription (Whisper API)
- Auto-extract action items
- Link to relevant deals

### 4.4 LP Reporting (Week 4)
- Quarterly letter generation
- Performance charts
- Export to PDF/DOCX
- This is a massive time sink for firms

---

## PHASE 5: QUALITY REQUIREMENTS

### No Fake Data Policy
```typescript
// BAD - Never do this
const stats = {
  documents: 2847,  // Hardcoded
  deals: 23,        // Fake
};

// GOOD - Always fetch real data
const stats = await db.$transaction([
  db.document.count({where: {organizationId}}),
  db.deal.count({where: {organizationId}}),
]);
```

### Error Handling
```typescript
// Every API route must have:
export async function POST(req: Request) {
  try {
    // ... logic
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof ZodError) {
      return Response.json({error: 'Validation failed', details: error.errors}, {status: 400});
    }
    if (error instanceof UnauthorizedError) {
      return Response.json({error: 'Unauthorized'}, {status: 401});
    }

    // Don't leak internal errors
    return Response.json({error: 'Internal server error'}, {status: 500});
  }
}
```

### Loading States
```typescript
// Every data-fetching component must have:
function DealsList() {
  const {data, isLoading, error} = useQuery(['deals'], fetchDeals);

  if (isLoading) return <DealsListSkeleton />;
  if (error) return <ErrorState message="Failed to load deals" />;
  if (!data?.length) return <EmptyState message="No deals yet" />;

  return <DealsTable data={data} />;
}
```

### Testing Requirements
- [ ] Auth flow works end-to-end
- [ ] Document upload → processing → search works
- [ ] Chat returns answers from uploaded docs
- [ ] Deal CRUD with stage tracking works
- [ ] All pages load without errors
- [ ] All pages show real data, not mocks

---

## PHASE 6: LAUNCH CHECKLIST

### Environment Variables (All Required)
```env
# Database (MUST have pgvector)
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI (Required for core features)
OPENAI_API_KEY=

# Storage (Required for documents)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Background Jobs
REDIS_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Deployment Verification
1. [ ] Register new account
2. [ ] Upload a PDF document
3. [ ] Wait for processing to complete
4. [ ] Search for content from that PDF
5. [ ] Ask AI a question about the PDF
6. [ ] Verify answer cites the PDF
7. [ ] Create a deal
8. [ ] Attach the document to the deal
9. [ ] Run AI analysis on deal
10. [ ] Verify analysis references document content

---

## SUCCESS CRITERIA

The build is complete when:

1. **A user can upload a pitch deck and ask "What are the key risks?" and get a real answer citing specific pages**

2. **A user can search "companies with >100% NRR" and find relevant documents**

3. **A user can create a deal, attach documents, and get AI-generated analysis**

4. **All metrics shown are real database queries, not constants**

5. **The system fails gracefully with helpful errors, not blank screens**

---

## WHAT NOT TO BUILD

- ❌ Fake data for demos
- ❌ Mock API responses
- ❌ Placeholder text extraction
- ❌ Random relevance scores
- ❌ Hardcoded statistics
- ❌ UI without backend integration

---

## TIMELINE EXPECTATION

- **Week 1**: Auth, Upload, Processing, Basic Search
- **Week 2**: Chat with RAG, Deal Management
- **Week 3**: Portfolio, Integrations
- **Week 4**: Polish, Testing, Launch Prep

**This is real engineering work. Do not shortcut with mocks.**
