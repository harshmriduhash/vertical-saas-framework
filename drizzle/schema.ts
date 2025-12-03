import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, json, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tenant/Organization table for multi-tenancy support
 * Each user can belong to one or more tenants
 */
export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  ownerId: varchar("ownerId", { length: 64 }).notNull(),
  businessType: mysqlEnum("businessType", [
    "photographer",
    "musician",
    "artist",
    "content_creator",
    "real_estate_agent",
    "designer",
    "writer",
    "consultant",
    "other"
  ]).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "starter", "professional", "enterprise"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "cancelled", "past_due"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  customDomain: varchar("customDomain", { length: 255 }),
  settings: json("settings").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  ownerIdx: index("owner_idx").on(table.ownerId),
  slugIdx: uniqueIndex("slug_idx").on(table.slug),
}));

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * User-Tenant relationship (many-to-many)
 */
export const userTenants = mysqlTable("user_tenants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tenantIdx: index("tenant_idx").on(table.tenantId),
  userTenantIdx: uniqueIndex("user_tenant_idx").on(table.userId, table.tenantId),
}));

export type UserTenant = typeof userTenants.$inferSelect;
export type InsertUserTenant = typeof userTenants.$inferInsert;

/**
 * Enabled modules/features per tenant
 */
export const tenantModules = mysqlTable("tenant_modules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  moduleType: mysqlEnum("moduleType", [
    "crm",
    "scheduling",
    "invoicing",
    "website_builder",
    "marketing",
    "analytics",
    "ai_assistant",
    "project_management",
    "file_storage",
    "email_campaigns"
  ]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  config: json("config").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  moduleIdx: uniqueIndex("module_idx").on(table.tenantId, table.moduleType),
}));

export type TenantModule = typeof tenantModules.$inferSelect;
export type InsertTenantModule = typeof tenantModules.$inferInsert;

/**
 * CRM Contacts/Leads
 */
export const contacts = mysqlTable("contacts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  status: mysqlEnum("status", ["lead", "prospect", "client", "inactive"]).default("lead").notNull(),
  source: varchar("source", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  notes: text("notes"),
  customFields: json("customFields").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  emailIdx: index("email_idx").on(table.email),
  statusIdx: index("status_idx").on(table.status),
}));

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Appointments/Bookings
 */
export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  contactId: varchar("contactId", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: varchar("location", { length: 500 }),
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  reminderSent: boolean("reminderSent").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  contactIdx: index("contact_idx").on(table.contactId),
  startTimeIdx: index("start_time_idx").on(table.startTime),
}));

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Invoices
 */
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  contactId: varchar("contactId", { length: 64 }),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  items: json("items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().notNull(),
  notes: text("notes"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  contactIdx: index("contact_idx").on(table.contactId),
  statusIdx: index("status_idx").on(table.status),
  invoiceNumberIdx: uniqueIndex("invoice_number_idx").on(table.tenantId, table.invoiceNumber),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * AI Conversations/Interactions
 */
export const aiConversations = mysqlTable("ai_conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }),
  type: mysqlEnum("type", ["business_analysis", "content_generation", "customer_support", "general"]).notNull(),
  messages: json("messages").$type<Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
  }>>().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  userIdx: index("user_idx").on(table.userId),
}));

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

/**
 * Business Insights generated by AI
 */
export const businessInsights = mysqlTable("business_insights", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  insightType: mysqlEnum("insightType", [
    "efficiency_opportunity",
    "revenue_prediction",
    "client_churn_risk",
    "automation_suggestion",
    "growth_opportunity"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["new", "viewed", "in_progress", "implemented", "dismissed"]).default("new").notNull(),
  data: json("data").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
}));

export type BusinessInsight = typeof businessInsights.$inferSelect;
export type InsertBusinessInsight = typeof businessInsights.$inferInsert;

/**
 * Automation workflows
 */
export const automations = mysqlTable("automations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  trigger: json("trigger").$type<{
    type: string;
    config: Record<string, any>;
  }>().notNull(),
  actions: json("actions").$type<Array<{
    type: string;
    config: Record<string, any>;
  }>>().notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("lastRun"),
  runCount: int("runCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  enabledIdx: index("enabled_idx").on(table.enabled),
}));

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = typeof automations.$inferInsert;

/**
 * Integration configurations (Stripe, Google, Slack, etc.)
 */
export const integrations = mysqlTable("integrations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  provider: mysqlEnum("provider", [
    "stripe",
    "paypal",
    "google_drive",
    "google_calendar",
    "slack",
    "mailchimp",
    "sendgrid",
    "twilio"
  ]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  credentials: json("credentials").$type<Record<string, any>>(), // Encrypted in practice
  config: json("config").$type<Record<string, any>>(),
  lastSync: timestamp("lastSync"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  providerIdx: uniqueIndex("provider_idx").on(table.tenantId, table.provider),
}));

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * Analytics events for tracking usage and insights
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventData: json("eventData").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;



/**
 * Compliance checklists - templates for different business types and regions
 */
export const complianceChecklists = mysqlTable("compliance_checklists", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  region: varchar("region", { length: 100 }),
  businessType: varchar("businessType", { length: 100 }),
  sections: json("sections").$type<Array<{
    id: string;
    title: string;
    description: string;
    items: Array<{
      id: string;
      label: string;
      details: string;
      link?: string;
      note?: string;
      frequency?: 'once' | 'quarterly' | 'annually' | 'monthly';
      dueDate?: string;
    }>;
  }>>().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  regionIdx: index("region_idx").on(table.region),
  businessTypeIdx: index("business_type_idx").on(table.businessType),
}));

export type ComplianceChecklist = typeof complianceChecklists.$inferSelect;
export type InsertComplianceChecklist = typeof complianceChecklists.$inferInsert;

/**
 * Tenant compliance tracking - tracks completion status for each tenant
 */
export const tenantCompliance = mysqlTable("tenant_compliance", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  checklistId: varchar("checklistId", { length: 64 }).notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "skipped"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: varchar("completedBy", { length: 64 }),
  notes: text("notes"),
  attachments: json("attachments").$type<Array<{ name: string; url: string; uploadedAt: string }>>(),
  nextDueDate: timestamp("nextDueDate"),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  checklistIdx: index("checklist_idx").on(table.checklistId),
  statusIdx: index("status_idx").on(table.status),
  dueDateIdx: index("due_date_idx").on(table.nextDueDate),
}));

export type TenantCompliance = typeof tenantCompliance.$inferSelect;
export type InsertTenantCompliance = typeof tenantCompliance.$inferInsert;

/**
 * Compliance reminders - scheduled reminders for upcoming deadlines
 */
export const complianceReminders = mysqlTable("compliance_reminders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  complianceId: varchar("complianceId", { length: 64 }).notNull(),
  reminderType: mysqlEnum("reminderType", ["email", "notification", "sms"]).notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  message: text("message").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
  scheduledIdx: index("scheduled_idx").on(table.scheduledFor),
  sentIdx: index("sent_idx").on(table.sent),
}));

export type ComplianceReminder = typeof complianceReminders.$inferSelect;
export type InsertComplianceReminder = typeof complianceReminders.$inferInsert;

