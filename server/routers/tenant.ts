import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as tenantService from '../services/tenant';

/**
 * Tenant management router
 */
export const tenantRouter = router({
  /**
   * Create a new tenant
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        businessType: z.enum([
          'photographer',
          'musician',
          'artist',
          'content_creator',
          'real_estate_agent',
          'designer',
          'writer',
          'consultant',
          'other',
        ]),
        subscriptionTier: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const slug = tenantService.generateSlug(input.name);
      
      const tenantId = await tenantService.createTenant({
        name: input.name,
        slug,
        ownerId: ctx.user.id,
        businessType: input.businessType,
        subscriptionTier: input.subscriptionTier,
      });

      return { tenantId, slug };
    }),

  /**
   * Get current user's tenants
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenants = await tenantService.getTenantsForUser(ctx.user.id);
    return tenants;
  }),

  /**
   * Get specific tenant details
   */
  get: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) {
        throw new Error('Tenant not found or access denied');
      }
      return tenant;
    }),

  /**
   * Update tenant subscription
   */
  updateSubscription: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        tier: z.enum(['free', 'starter', 'professional', 'enterprise']),
        status: z.enum(['active', 'trial', 'cancelled', 'past_due']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is owner/admin
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant || (tenant.userRole !== 'owner' && tenant.userRole !== 'admin')) {
        throw new Error('Unauthorized');
      }

      await tenantService.updateTenantSubscription(
        input.tenantId,
        input.tier,
        input.status
      );

      return { success: true };
    }),

  /**
   * Toggle module for tenant
   */
  toggleModule: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        moduleType: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is owner/admin
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant || (tenant.userRole !== 'owner' && tenant.userRole !== 'admin')) {
        throw new Error('Unauthorized');
      }

      // Check if tier allows this module
      if (input.enabled && !tenantService.canAccessModule(tenant.tenant.subscriptionTier, input.moduleType)) {
        throw new Error('Module not available in current subscription tier');
      }

      await tenantService.toggleTenantModule(
        input.tenantId,
        input.moduleType,
        input.enabled
      );

      return { success: true };
    }),
});

