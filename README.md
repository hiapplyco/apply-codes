# Apply - AI-Powered Recruitment Platform

Apply is a comprehensive AI-driven recruitment platform that transforms how companies find, evaluate, and hire talent. By leveraging advanced AI models and intelligent automation, Apply helps recruiters and hiring teams work smarter, not harder.

## 🎯 What is Apply?

Apply combines the power of AI with intuitive workflows to create a seamless recruitment experience. Whether you're sourcing candidates, conducting interviews, or managing your talent pipeline, Apply provides the tools and intelligence you need to make better hiring decisions faster.

## ✨ Key Features

### 🔍 **Intelligent Candidate Sourcing**
- **AI-Powered Boolean Search**: Automatically generate complex boolean queries from simple job descriptions
- **Multi-Platform Search**: Find candidates across LinkedIn, Indeed, and other major platforms
- **Smart Filters**: Refine searches with AI-suggested criteria based on your requirements

### 🤖 **AI Recruitment Assistant**
- **24/7 Chat Support**: Get instant help with recruiting strategies, candidate evaluation, and more
- **Tool-Aware Intelligence**: Automatically uses the right tools based on your needs
- **Context-Aware Responses**: Maintains conversation history and project context

### 📹 **Smart Meeting Room**
- **AI-Assisted Interviews**: Real-time interview guidance and question suggestions
- **Automated Transcription**: Capture every detail with live transcription
- **Structured Evaluation**: Consistent candidate assessment with AI-powered rubrics

### 💼 **Project Management**
- **Candidate Organization**: Group candidates by role, status, or custom criteria
- **Collaborative Workflows**: Share projects and insights with your team
- **Progress Tracking**: Monitor your recruitment pipeline at a glance

### 🔗 **20+ Integrations**
- **ATS Systems**: Greenhouse, Lever, Workday, and more
- **Communication**: Email, calendar, and messaging platforms
- **Data Enrichment**: Nymeria, Hunter.io, and other contact finding services

### 📊 **Analytics & Insights**
- **Recruitment Metrics**: Track time-to-hire, source effectiveness, and more
- **AI-Generated Reports**: Get actionable insights from your recruitment data
- **Predictive Analytics**: Forecast hiring needs and candidate success

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hiapplyco/apply-codes.git
   cd apply-codes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_API_KEY=your_google_api_key
   VITE_NYMERIA_API_KEY=your_nymeria_api_key
   ```

4. **Run database migrations**
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

```
apply-codes/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions
│   └── context/        # React context providers
├── supabase/
│   ├── functions/      # Edge functions (35+ AI agents)
│   └── migrations/     # Database schema migrations
└── public/             # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **AI**: Google Gemini 2.0 Flash
- **UI Library**: shadcn/ui with custom brutalist design system
- **State Management**: React Context + Tanstack Query
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 🔐 Security & Compliance

- **SOC 2 Compliant**: Enterprise-grade security standards
- **Data Encryption**: End-to-end encryption for sensitive data
- **GDPR Ready**: Privacy-first architecture
- **Role-Based Access**: Granular permissions system
- **Audit Trails**: Complete activity logging

## 💳 Subscription & Billing

Apply offers a 21-day free trial with full access to all features. After the trial:

- **Starter**: $49/month - Perfect for individual recruiters
- **Professional**: $149/month - For growing teams
- **Enterprise**: Custom pricing - Unlimited everything

All plans include core features with varying limits on searches, enrichments, and team members.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Edge Functions Guide](docs/edge-functions.md)
- [Integration Guide](docs/integrations.md)
- [Deployment Guide](docs/deployment.md)

## 🆘 Support

- **Documentation**: [docs.apply.codes](https://docs.apply.codes)
- **Email**: support@apply.codes
- **GitHub Issues**: [Report a bug](https://github.com/hiapplyco/apply-codes/issues)

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.

---

Built with ❤️ by the Apply team. Making recruitment more human with AI.