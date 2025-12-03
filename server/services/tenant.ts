import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { tenants, userTenants, tenantModules, InsertTenant, InsertUserTenant, InsertTenantModule } from '../../drizzle/schema';
import { nanoid } from 'nanoid';

/**
 * Tenant Management Service
 * Handles multi-tenancy operations
 */

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerId: string;
  businessType: 'photographer' | 'musician' | 'artist' | 'content_creator' | 'real_estate_agent' | 'designer' | 'writer' | 'consultant' | 'other';
  subscriptionTier?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export interface TenantWithModules {
  tenant: typeof tenants.$inferSelect;
  modules: Array<typeof tenantModules.$inferSelect>;
  userRole: 'owner' | 'admin' | 'member';
}

/**
 * Create a new tenant with default modules
 */
export async function createTenant(input: CreateTenantInput): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const tenantId = nanoid();
  const now = new Date();

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // Create tenant
  const newTenant: InsertTenant = {
    id: tenantId,
    name: input.name,
    slug: input.slug,
    ownerId: input.ownerId,
    businessType: input.businessType,
    subscriptionTier: input.subscriptionTier || 'free',
    subscriptionStatus: 'trial',
    trialEndsAt,
    settings: {},
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(tenants).values(newTenant);

  // Create user-tenant relationship
  const userTenantId = nanoid();
  const newUserTenant: InsertUserTenant = {
    id: userTenantId,
    userId: input.ownerId,
    tenantId,
    role: 'owner',
    createdAt: now,
  };

  await db.insert(userTenants).values(newUserTenant);

  // Enable default modules based on business type and tier
  const defaultModules = getDefaultModules(input.businessType, input.subscriptionTier || 'free');
  
  const moduleRecords: InsertTenantModule[] = defaultModules.map(moduleType => ({
    id: nanoid(),
    tenantId,
    moduleType,
    enabled: true,
    config: {},
    createdAt: now,
    updatedAt: now,
  }));

  if (moduleRecords.length > 0) {
    await db.insert(tenantModules).values(moduleRecords);
  }

  return tenantId;
}

/**
 * Get tenant with modules for a user
 */
export async function getTenantForUser(userId: string, tenantId: string): Promise<TenantWithModules | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get tenant
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantResult.length === 0) return null;

  // Get user's role in tenant
  const userTenantResult = await db
    .select()
    .from(userTenants)
    .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)))
    .limit(1);

  if (userTenantResult.length === 0) return null;

  // Get enabled modules
  const modulesResult = await db
    .select()
    .from(tenantModules)
    .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.enabled, true)));

  return {
    tenant: tenantResult[0],
    modules: modulesResult,
    userRole: userTenantResult[0].role,
  };
}

/**
 * Get all tenants for a user
 */
export async function getTenantsForUser(userId: string): Promise<TenantWithModules[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get all user-tenant relationships
  const userTenantsResult = await db
    .select()
    .from(userTenants)
    .where(eq(userTenants.userId, userId));

  const results: TenantWithModules[] = [];

  for (const ut of userTenantsResult) {
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ut.tenantId))
      .limit(1);

    if (tenantResult.length === 0) continue;

    const modulesResult = await db
      .select()
      .from(tenantModules)
      .where(and(eq(tenantModules.tenantId, ut.tenantId), eq(tenantModules.enabled, true)));

    results.push({
      tenant: tenantResult[0],
      modules: modulesResult,
      userRole: ut.role,
    });
  }

  return results;
}

/**
 * Update tenant subscription
 */
export async function updateTenantSubscription(
  tenantId: string,
  tier: 'free' | 'starter' | 'professional' | 'enterprise',
  status: 'active' | 'trial' | 'cancelled' | 'past_due'
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(tenants)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  // Update modules based on new tier
  const allowedModules = getDefaultModules('other', tier); // Get all modules for tier
  
  // Disable modules not in the tier
  await db
    .update(tenantModules)
    .set({ enabled: false, updatedAt: new Date() })
    .where(eq(tenantModules.tenantId, tenantId));

  // Enable modules for the tier
  const existingModules = await db
    .select()
    .from(tenantModules)
    .where(eq(tenantModules.tenantId, tenantId));

  const existingModuleTypes = new Set(existingModules.map(m => m.moduleType));
  const newModules: InsertTenantModule[] = [];

  for (const moduleType of allowedModules) {
    if (existingModuleTypes.has(moduleType)) {
      // Re-enable existing module
      await db
        .update(tenantModules)
        .set({ enabled: true, updatedAt: new Date() })
        .where(and(
          eq(tenantModules.tenantId, tenantId),
          eq(tenantModules.moduleType, moduleType)
        ));
    } else {
      // Create new module
      newModules.push({
        id: nanoid(),
        tenantId,
        moduleType,
        enabled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (newModules.length > 0) {
    await db.insert(tenantModules).values(newModules);
  }
}

/**
 * Enable/disable a module for a tenant
 */
export async function toggleTenantModule(
  tenantId: string,
  moduleType: string,
  enabled: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(tenantModules)
    .set({ enabled, updatedAt: new Date() })
    .where(and(
      eq(tenantModules.tenantId, tenantId),
      eq(tenantModules.moduleType, moduleType as any)
    ));
}

/**
 * Check if tenant has access to a module based on subscription tier
 */
export function canAccessModule(
  tier: 'free' | 'starter' | 'professional' | 'enterprise',
  moduleType: string
): boolean {
  const tierModules = {
    free: ['crm', 'scheduling', 'invoicing', 'website_builder'],
    starter: ['crm', 'scheduling', 'invoicing', 'website_builder', 'ai_assistant', 'marketing'],
    professional: ['crm', 'scheduling', 'invoicing', 'website_builder', 'ai_assistant', 'marketing', 'analytics', 'project_management', 'email_campaigns'],
    enterprise: ['crm', 'scheduling', 'invoicing', 'website_builder', 'ai_assistant', 'marketing', 'analytics', 'project_management', 'email_campaigns', 'file_storage'],
  };

  return tierModules[tier].includes(moduleType);
}

/**
 * Get default modules based on business type and subscription tier
 */
function getDefaultModules(
  businessType: string,
  tier: 'free' | 'starter' | 'professional' | 'enterprise'
): Array<'crm' | 'scheduling' | 'invoicing' | 'website_builder' | 'marketing' | 'analytics' | 'ai_assistant' | 'project_management' | 'file_storage' | 'email_campaigns'> {
  // Base modules for free tier
  const freeModules: Array<any> = ['crm', 'scheduling', 'invoicing'];

  // Additional modules by tier
  const tierModules = {
    free: freeModules,
    starter: [...freeModules, 'ai_assistant', 'marketing'],
    professional: [...freeModules, 'ai_assistant', 'marketing', 'analytics', 'email_campaigns'],
    enterprise: [...freeModules, 'ai_assistant', 'marketing', 'analytics', 'email_campaigns', 'project_management', 'file_storage'],
  };

  // Business-type specific additions
  const businessSpecific: Record<string, string[]> = {
    photographer: ['file_storage', 'website_builder'],
    musician: ['website_builder', 'marketing'],
    artist: ['website_builder', 'file_storage'],
    content_creator: ['analytics', 'marketing'],
    real_estate_agent: ['crm', 'analytics'],
  };

  const modules = new Set(tierModules[tier]);
  
  // Add business-specific modules if tier allows
  if (businessType in businessSpecific) {
    businessSpecific[businessType].forEach(m => {
      if (canAccessModule(tier, m)) {
        modules.add(m as any);
      }
    });
  }

  return Array.from(modules) as any;
}

/**
 * Generate unique slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

