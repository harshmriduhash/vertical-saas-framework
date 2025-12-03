# API Documentation

The Vertical SaaS Framework uses **tRPC** for type-safe API communication between the frontend and backend. This approach eliminates the need for manual API documentation synchronization, as types are automatically shared between client and server.

## Authentication

All protected endpoints require authentication via JWT tokens. The framework uses OAuth 2.0 for user authentication with automatic token refresh.

### Authentication Flow

When a user logs in, the server issues a JWT token stored in an HTTP-only cookie. This token is automatically included in all subsequent requests. The token contains the user's ID, email, and role, which are validated on every request to protected endpoints.

**Token Expiration**: Tokens expire after 7 days of inactivity. The client automatically refreshes tokens when they approach expiration.

**Security Considerations**: Tokens are signed with a secret key and cannot be tampered with. Always use HTTPS in production to prevent token interception.

## API Structure

The API is organized into logical routers, each handling a specific domain of functionality. All endpoints follow RESTful conventions adapted for tRPC's procedure-based architecture.

### Base URL

```
Development: http://localhost:3000/api/trpc
Production: https://yourdomain.com/api/trpc
```

### Response Format

All tRPC procedures return typed responses. Errors are automatically serialized and include error codes, messages, and stack traces in development mode.

```typescript
// Success response
{
  result: {
    data: { /* your data */ }
  }
}

// Error response
{
  error: {
    message: "Error description",
    code: "UNAUTHORIZED",
    data: {
      code: "UNAUTHORIZED",
      httpStatus: 401
    }
  }
}
```

## Tenant Management

Tenant management endpoints handle multi-tenant organization creation, configuration, and subscription management. Each tenant represents a separate customer workspace with isolated data.

### Create Tenant

Creates a new tenant workspace for the authenticated user. The user automatically becomes the owner with full administrative privileges.

**Procedure**: `tenant.create`

**Input**:
```typescript
{
  name: string;                    // Business name (1-255 characters)
  businessType: 'photographer' | 'musician' | 'artist' | 'content_creator' | 
                'real_estate_agent' | 'designer' | 'writer' | 'consultant' | 'other';
  subscriptionTier?: 'free' | 'starter' | 'professional' | 'enterprise';  // Default: 'free'
}
```

**Output**:
```typescript
{
  tenantId: string;                // Unique tenant identifier
  slug: string;                    // URL-friendly tenant slug
}
```

**Example**:
```typescript
const result = await trpc.tenant.create.mutate({
  name: "Sarah's Photography Studio",
  businessType: 'photographer',
  subscriptionTier: 'free',
});
// Returns: { tenantId: 'abc123', slug: 'sarahs-photography-studio' }
```

### List Tenants

Retrieves all tenants accessible by the authenticated user, including their role in each tenant and enabled modules.

**Procedure**: `tenant.list`

**Input**: None

**Output**:
```typescript
Array<{
  tenant: {
    id: string;
    name: string;
    slug: string;
    businessType: string;
    subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
    subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'past_due';
    trialEndsAt: Date | null;
    createdAt: Date;
  };
  modules: Array<{
    id: string;
    moduleType: string;
    enabled: boolean;
    config: Record<string, any>;
  }>;
  userRole: 'owner' | 'admin' | 'member';
}>
```

### Get Tenant

Retrieves detailed information about a specific tenant, including all enabled modules and the user's role.

**Procedure**: `tenant.get`

**Input**:
```typescript
{
  tenantId: string;
}
```

**Output**: Same as single item from `tenant.list`

### Update Subscription

Updates a tenant's subscription tier and status. Only owners and admins can perform this operation.

**Procedure**: `tenant.updateSubscription`

**Input**:
```typescript
{
  tenantId: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'cancelled' | 'past_due';
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

### Toggle Module

Enables or disables a specific module for a tenant. The module must be available in the tenant's current subscription tier.

**Procedure**: `tenant.toggleModule`

**Input**:
```typescript
{
  tenantId: string;
  moduleType: string;              // e.g., 'crm', 'scheduling', 'invoicing'
  enabled: boolean;
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

## AI Services

AI-powered endpoints provide business analysis, content generation, and automated insights using open-source models from Hugging Face.

### Chat with AI Assistant

Initiates or continues a conversation with the AI assistant. The assistant maintains context across multiple messages in a conversation.

**Procedure**: `ai.chat`

**Input**:
```typescript
{
  tenantId: string;
  conversationId?: string;         // Omit to start new conversation
  message: string;                 // User's message
  type?: 'business_analysis' | 'content_generation' | 'customer_support' | 'general';
}
```

**Output**:
```typescript
{
  conversationId: string;
  response: string;                // AI's response
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}
```

**Example**:
```typescript
const result = await trpc.ai.chat.mutate({
  tenantId: 'abc123',
  message: 'How can I improve my client retention?',
  type: 'business_analysis',
});
```

### Analyze Business Needs

Analyzes the user's business challenges and goals, then provides personalized recommendations for features, automations, and improvements.

**Procedure**: `ai.analyzeBusinessNeeds`

**Input**:
```typescript
{
  tenantId: string;
  currentChallenges: string[];     // List of challenges
  goals: string[];                 // List of goals
  currentTools?: string[];         // Optional: tools currently in use
}
```

**Output**:
```typescript
{
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: Array<{
    module: string;
    reason: string;
    expectedImpact: string;
  }>;
  automationOpportunities: Array<{
    task: string;
    effort: string;
    impact: string;
  }>;
}
```

**Example**:
```typescript
const analysis = await trpc.ai.analyzeBusinessNeeds.mutate({
  tenantId: 'abc123',
  currentChallenges: [
    'Managing client relationships',
    'Following up with leads',
    'Creating invoices',
  ],
  goals: [
    'Get more clients',
    'Save time on admin tasks',
    'Increase revenue',
  ],
});
```

### Generate Content

Generates marketing content such as emails, social media posts, or client messages using AI.

**Procedure**: `ai.generateContent`

**Input**:
```typescript
{
  tenantId: string;
  type: 'email' | 'social' | 'message';
  purpose: string;                 // What the content should achieve
  tone?: 'professional' | 'casual' | 'friendly';  // Default: 'professional'
  audience?: string;               // Target audience description
  keyPoints?: string[];            // Key points to include
}
```

**Output**:
```typescript
{
  content: string;                 // Generated content
}
```

**Example**:
```typescript
const email = await trpc.ai.generateContent.mutate({
  tenantId: 'abc123',
  type: 'email',
  purpose: 'Follow up with a lead after initial consultation',
  tone: 'friendly',
  keyPoints: [
    'Thank them for their time',
    'Recap key discussion points',
    'Propose next steps',
  ],
});
```

### Get Business Insights

Retrieves AI-generated business insights and recommendations for a tenant. Insights can be filtered by status.

**Procedure**: `ai.getInsights`

**Input**:
```typescript
{
  tenantId: string;
  status?: 'new' | 'viewed' | 'in_progress' | 'implemented' | 'dismissed';
}
```

**Output**:
```typescript
Array<{
  id: string;
  insightType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'viewed' | 'in_progress' | 'implemented' | 'dismissed';
  createdAt: Date;
}>
```

### Update Insight Status

Marks an insight as viewed, in progress, implemented, or dismissed.

**Procedure**: `ai.updateInsightStatus`

**Input**:
```typescript
{
  tenantId: string;
  insightId: string;
  status: 'new' | 'viewed' | 'in_progress' | 'implemented' | 'dismissed';
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

### Get Conversations

Retrieves the conversation history for a tenant, showing all past AI assistant interactions.

**Procedure**: `ai.getConversations`

**Input**:
```typescript
{
  tenantId: string;
}
```

**Output**:
```typescript
Array<{
  id: string;
  title: string;
  type: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}>
```

## CRM (Contact Management)

CRM endpoints handle contact and lead management, including creation, updates, search, and statistics.

### Create Contact

Creates a new contact or lead in the CRM system.

**Procedure**: `crm.create`

**Input**:
```typescript
{
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;                  // Must be valid email format
  phone?: string;
  company?: string;
  status?: 'lead' | 'prospect' | 'client' | 'inactive';  // Default: 'lead'
  source?: string;                 // Lead source (e.g., 'website', 'referral')
  tags?: string[];                 // Custom tags for categorization
  notes?: string;
  customFields?: Record<string, any>;  // Additional custom data
}
```

**Output**:
```typescript
{
  contactId: string;
}
```

**Example**:
```typescript
const contact = await trpc.crm.create.mutate({
  tenantId: 'abc123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  status: 'lead',
  source: 'website',
  tags: ['photography', 'wedding'],
  notes: 'Interested in wedding photography package',
});
```

### List Contacts

Retrieves contacts with optional filtering and search capabilities. Supports pagination for large contact lists.

**Procedure**: `crm.list`

**Input**:
```typescript
{
  tenantId: string;
  status?: 'lead' | 'prospect' | 'client' | 'inactive';  // Filter by status
  search?: string;                 // Search in name, email, company
  limit?: number;                  // Results per page (1-100, default: 50)
  offset?: number;                 // Pagination offset (default: 0)
}
```

**Output**:
```typescript
Array<{
  id: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'lead' | 'prospect' | 'client' | 'inactive';
  source: string | null;
  tags: string[];
  notes: string | null;
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Example**:
```typescript
// Get all active clients
const clients = await trpc.crm.list.query({
  tenantId: 'abc123',
  status: 'client',
  limit: 50,
  offset: 0,
});

// Search for contacts
const results = await trpc.crm.list.query({
  tenantId: 'abc123',
  search: 'john',
});
```

### Get Contact

Retrieves detailed information about a specific contact.

**Procedure**: `crm.get`

**Input**:
```typescript
{
  tenantId: string;
  contactId: string;
}
```

**Output**: Same as single item from `crm.list`, or `null` if not found.

### Update Contact

Updates an existing contact's information. Only provided fields are updated; omitted fields remain unchanged.

**Procedure**: `crm.update`

**Input**:
```typescript
{
  tenantId: string;
  contactId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: 'lead' | 'prospect' | 'client' | 'inactive';
  source?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

**Example**:
```typescript
// Convert lead to client
await trpc.crm.update.mutate({
  tenantId: 'abc123',
  contactId: 'contact123',
  status: 'client',
  notes: 'Signed contract for wedding photography package',
});
```

### Delete Contact

Permanently deletes a contact from the CRM system. This action cannot be undone.

**Procedure**: `crm.delete`

**Input**:
```typescript
{
  tenantId: string;
  contactId: string;
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

### Get CRM Statistics

Retrieves aggregate statistics about contacts, including counts by status.

**Procedure**: `crm.stats`

**Input**:
```typescript
{
  tenantId: string;
}
```

**Output**:
```typescript
{
  total: number;
  leads: number;
  prospects: number;
  clients: number;
  inactive: number;
}
```

## Authentication

Authentication endpoints handle user login, logout, and session management.

### Get Current User

Retrieves the currently authenticated user's information. Returns `null` if not authenticated.

**Procedure**: `auth.me`

**Input**: None

**Output**:
```typescript
{
  id: string;
  name: string | null;
  email: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
} | null
```

### Logout

Logs out the current user by invalidating their session token.

**Procedure**: `auth.logout`

**Input**: None

**Output**:
```typescript
{
  success: true;
}
```

## Error Handling

The API uses standard tRPC error codes to indicate different types of failures. Always check for errors in your client code and handle them appropriately.

### Error Codes

**UNAUTHORIZED** (401): User is not authenticated. Redirect to login page.

**FORBIDDEN** (403): User is authenticated but lacks permission for this operation.

**BAD_REQUEST** (400): Invalid input data. Check error message for details.

**NOT_FOUND** (404): Requested resource does not exist.

**INTERNAL_SERVER_ERROR** (500): Server error. Retry the request or contact support.

### Error Response Example

```typescript
try {
  const result = await trpc.crm.create.mutate({ /* ... */ });
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else if (error.data?.code === 'BAD_REQUEST') {
    // Show validation errors
    console.error(error.message);
  } else {
    // Generic error handling
    console.error('An error occurred:', error.message);
  }
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse and ensure fair usage. Rate limits vary by subscription tier and endpoint type.

### Rate Limit Tiers

**Free Tier**: 100 requests per 15 minutes per IP address

**Starter Tier**: 500 requests per 15 minutes per user

**Professional Tier**: 2,000 requests per 15 minutes per user

**Enterprise Tier**: 10,000 requests per 15 minutes per user

### Rate Limit Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

When rate limits are exceeded, the API returns a 429 (Too Many Requests) error with a `Retry-After` header indicating when to retry.

## Webhooks

The framework supports webhooks for real-time event notifications. Configure webhook endpoints in your tenant settings to receive events.

### Supported Events

- `contact.created` - New contact added
- `contact.updated` - Contact information changed
- `invoice.created` - New invoice generated
- `invoice.paid` - Invoice payment received
- `appointment.booked` - New appointment scheduled
- `insight.generated` - New AI insight available

### Webhook Payload

```typescript
{
  event: string;                   // Event type
  tenantId: string;
  timestamp: string;               // ISO 8601 timestamp
  data: Record<string, any>;       // Event-specific data
  signature: string;               // HMAC signature for verification
}
```

### Webhook Verification

Verify webhook authenticity by checking the HMAC signature:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Client Usage Examples

### React Component Example

```typescript
import { trpc } from '@/lib/trpc';

function ContactList({ tenantId }: { tenantId: string }) {
  const { data: contacts, isLoading } = trpc.crm.list.useQuery({
    tenantId,
    status: 'client',
  });

  const createContact = trpc.crm.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useUtils().crm.list.invalidate();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {contacts?.map(contact => (
        <div key={contact.id}>
          {contact.firstName} {contact.lastName}
        </div>
      ))}
    </div>
  );
}
```

### Mutation with Error Handling

```typescript
const updateContact = trpc.crm.update.useMutation({
  onSuccess: () => {
    toast.success('Contact updated successfully');
  },
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      router.push('/login');
    } else {
      toast.error(error.message);
    }
  },
});

// Usage
updateContact.mutate({
  tenantId: 'abc123',
  contactId: 'contact123',
  status: 'client',
});
```

---

**API Support**: For questions about the API, visit the [GitHub Discussions](https://github.com/Gnoscenti/vertical-saas-framework/discussions) or consult the inline TypeScript documentation in your IDE.

