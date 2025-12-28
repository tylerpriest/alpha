# AlphaIntel

AI-powered knowledge base platform for Venture Capital and Private Equity firms.

## Overview

AlphaIntel transforms decades of deal memos, research, and tribal knowledge into an AI assistant that understands your investment thesis. Knowledge compounds. People leave. Your wisdom stays.

### Key Features

- **Institutional Memory** - AI that learns your investment thesis, past decisions, and why you passed on deals
- **Due Diligence Acceleration** - Query years of research, competitor analysis, and market data instantly
- **Pattern Recognition** - AI identifies successful investment patterns across your portfolio history
- **Semantic Search** - Find information by meaning, not just keywords
- **Compliance-Ready** - Full audit trail of every query, access, and decision
- **Deal Intelligence** - AI-powered deal scoring, thesis matching, and portfolio pattern analysis

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **AI**: OpenAI API (GPT-4, Embeddings)
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/alphaintel.git
cd alphaintel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - Database URL
   - NextAuth secret
   - OpenAI API key
   - (Optional) Google OAuth credentials

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth pages (login, register)
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── dashboard/      # Dashboard-specific components
│   └── ...
├── lib/                 # Utilities and configs
│   ├── auth.ts         # NextAuth configuration
│   ├── db.ts           # Prisma client
│   ├── embeddings.ts   # Vector embeddings
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── styles/             # Global styles
```

## Features

### Knowledge Base
- Document upload (PDF, Word, Excel, PowerPoint)
- Automatic text extraction and indexing
- Semantic search with AI
- Collections and tags

### Deal Flow
- Kanban pipeline view
- Deal scoring with AI
- Document association
- Activity tracking

### Portfolio Management
- Company tracking
- Investment metrics (MOIC, IRR)
- Performance analytics
- Board seat tracking

### AI Chat
- Natural language queries
- Source-cited responses
- Context-aware conversations
- Deal and portfolio analysis

### Analytics
- Pipeline metrics
- Sector distribution
- Activity trends
- AI usage statistics

## API Reference

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document metadata

### Deals
- `GET /api/deals` - List deals
- `POST /api/deals` - Create deal

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat` - Get conversation history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - All rights reserved.

## Support

For support, contact support@alphaintel.ai
