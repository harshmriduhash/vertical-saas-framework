# Vertical SaaS Framework

An **AI-powered framework** for rapidly building vertical SaaS tools for creative professionals and small businesses. Built with open-source AI models from Hugging Face to keep costs low while delivering enterprise-grade capabilities.

## 🚀 Overview

This framework enables you to spin up fully-featured vertical SaaS applications in **days, not months**. It's specifically designed for creative professionals (photographers, musicians, artists, content creators, real estate agents) but can be adapted for any SMB vertical.

### Key Features

- **🤖 AI-Powered Business Analysis**: Analyzes user needs and recommends optimal features
- **👥 Multi-Tenant Architecture**: Secure data isolation for multiple customers
- **🎯 Modular Design**: Enable/disable features based on subscription tiers
- **💰 Freemium Ready**: Built-in support for Free, Starter, Professional, and Enterprise tiers
- **🔌 Open-Source AI**: Uses Hugging Face models to minimize API costs
- **📊 Built-in Analytics**: Track usage and generate insights
- **🎨 No-Code Friendly**: Intuitive UI designed for non-technical users

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- shadcn/ui component library
- React Router for navigation
- tRPC for type-safe API calls

**Backend:**
- Node.js with Express
- tRPC for API layer
- Drizzle ORM for database
- MySQL for data storage
- Hugging Face Inference API for AI

**AI Models (Open-Source):**
- **Chat**: Llama 3.2 3B Instruct (fast, efficient)
- **Analysis**: Mistral 7B Instruct (business insights)
- **Embeddings**: all-MiniLM-L6-v2 (semantic search)
- **Summarization**: BART Large CNN (documents)

### Database Schema

The framework includes 12 core tables:

1. **users** - Authentication and user profiles
2. **tenants** - Multi-tenant organizations
3. **user_tenants** - User-tenant relationships
4. **tenant_modules** - Enabled features per tenant
5. **contacts** - CRM contacts and leads
6. **appointments** - Scheduling and bookings
7. **invoices** - Billing and payments
8. **ai_conversations** - AI chat history
9. **business_insights** - AI-generated recommendations
10. **automations** - Workflow automation rules
11. **integrations** - Third-party service connections
12. **analytics_events** - Usage tracking

## 📦 Core Modules

### 1. CRM (Customer Relationship Management)
- Contact and lead management
- Status tracking (lead → prospect → client)
- Custom fields and tags
- Search and filtering
- AI-powered lead scoring

### 2. Scheduling
- Appointment booking
- Calendar integration
- Automated reminders
- No-show tracking
- Availability management

### 3. Invoicing
- Professional invoice generation
- Payment tracking
- Recurring invoices
- Tax calculations
- Payment gateway integration

### 4. AI Assistant
- Business analysis and recommendations
- Content generation (emails, social posts)
- Automated follow-ups
- Efficiency opportunity identification
- Revenue predictions

### 5. Marketing Automation
- Email campaigns
- Social media scheduling
- Lead nurturing sequences
- Analytics and reporting

### 6. Website Builder
- Template-based site creation
- Custom domain support
- SEO optimization
- Mobile-responsive designs

### 7. Analytics Dashboard
- Real-time business metrics
- Revenue tracking
- Client acquisition costs
- Conversion funnels
- Custom reports

### 8. Project Management
- Task tracking
- Deadline management
- File attachments
- Team collaboration

### 9. File Storage
- Secure cloud storage (S3)
- File organization
- Client file sharing
- Version control

### 10. Email Campaigns
- Bulk email sending
- Template management
- A/B testing
- Open and click tracking

## 🎯 Subscription Tiers

### Free Tier
- Up to 50 contacts
- Basic CRM
- Simple scheduling
- 5 invoices/month
- Community support

### Starter Tier ($39/month)
- 500 contacts
- AI business analyst
- Unlimited invoices
- Payment processing
- Email support

### Professional Tier ($99/month)
- Unlimited contacts
- Advanced AI features
- Marketing automation
- Analytics dashboard
- Priority support

### Enterprise Tier ($299/month)
- Everything in Professional
- Multi-user access
- White-label options
- API access
- Dedicated support

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8+
- pnpm (recommended) or npm
- Hugging Face API key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Harshmriduhash/vertical-saas-framework.git
cd vertical-saas-framework
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
DATABASE_URL=mysql://user:password@localhost:3306/vertical_saas
HUGGINGFACE_API_KEY=your_hf_api_key_here
JWT_SECRET=your_jwt_secret_here
```

4. **Run database migrations**
```bash
pnpm db:push
```

5. **Start the development server**
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Adding a New Business Type

Edit `drizzle/schema.ts` and add to the `businessType` enum:

```typescript
businessType: mysqlEnum("businessType", [
  "photographer",
  "musician",
  // ... existing types
  "your_new_type",
])
```

Then update the onboarding flow in `client/src/pages/Onboarding.tsx`.

### Customizing AI Models

Edit `server/services/ai.ts` to change the default models:

```typescript
const DEFAULT_MODELS = {
  chat: 'meta-llama/Llama-3.2-3B-Instruct',
  analysis: 'mistralai/Mistral-7B-Instruct-v0.2',
  // Change to your preferred models
};
```

### Adding New Modules

1. Create a new router in `server/routers/your-module.ts`
2. Add the module type to the schema in `drizzle/schema.ts`
3. Import and register in `server/routers.ts`
4. Create frontend components in `client/src/pages/`

## 📚 API Documentation

### tRPC Endpoints

#### Tenant Management
- `tenant.create` - Create a new tenant
- `tenant.list` - Get user's tenants
- `tenant.get` - Get tenant details
- `tenant.updateSubscription` - Update subscription tier
- `tenant.toggleModule` - Enable/disable modules

#### AI Services
- `ai.chat` - Chat with AI assistant
- `ai.analyzeBusinessNeeds` - Get business recommendations
- `ai.generateContent` - Generate marketing content
- `ai.getInsights` - Retrieve business insights
- `ai.updateInsightStatus` - Mark insights as viewed/implemented

#### CRM
- `crm.create` - Create a contact
- `crm.list` - List contacts with filtering
- `crm.get` - Get contact details
- `crm.update` - Update contact information
- `crm.delete` - Delete a contact
- `crm.stats` - Get CRM statistics

## 🎨 Customization

### Branding

Update the theme colors in `client/src/index.css`:

```css
:root {
  --primary: your-color;
  --secondary: your-color;
  /* ... */
}
```

### White-Label Support

The framework supports white-labeling for Enterprise customers:
- Custom domain configuration
- Branded email templates
- Custom logo and colors
- Remove "Powered by" footer

## 🔐 Security

- **Authentication**: OAuth 2.0 with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Isolation**: Tenant-level data segmentation
- **Encryption**: All sensitive data encrypted at rest
- **API Security**: Rate limiting and request validation

## 📊 Analytics & Monitoring

The framework includes built-in analytics:
- User activity tracking
- Feature usage metrics
- Revenue analytics
- Performance monitoring
- Error tracking

## 🚢 Deployment

### Production Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up S3 for file storage
- [ ] Configure email service (SendGrid/Mailgun)
- [ ] Set up payment processing (Stripe)
- [ ] Enable SSL/TLS
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: AWS ECS, Google Cloud Run, or Railway
- **Database**: AWS RDS, PlanetScale, or DigitalOcean
- **Storage**: AWS S3 or Cloudflare R2

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hugging Face](https://huggingface.co/) open-source AI models
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/Gnoscenti/vertical-saas-framework/wiki)
- **Issues**: [GitHub Issues](https://github.com/Gnoscenti/vertical-saas-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gnoscenti/vertical-saas-framework/discussions)

## 🗺️ Roadmap

### Q1 2025
- [ ] Mobile app (React Native)
- [ ] Advanced automation workflows
- [ ] Zapier integration
- [ ] Multi-language support

### Q2 2025
- [ ] Voice AI assistant
- [ ] Advanced analytics with ML predictions
- [ ] Marketplace for plugins
- [ ] API marketplace

### Q3 2025
- [ ] White-label mobile apps
- [ ] Advanced compliance tools
- [ ] Industry-specific templates
- [ ] AI-powered customer support

---

**Built with ❤️ using open-source AI models from Hugging Face**

*Empowering creative professionals and small businesses with enterprise-grade tools at affordable prices.*

