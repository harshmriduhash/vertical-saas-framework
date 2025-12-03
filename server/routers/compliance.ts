import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as complianceService from '../services/compliance';
import * as tenantService from '../services/tenant';
import { getDb } from '../db';
import { complianceChecklists } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Compliance tracking router
 */
export const complianceRouter = router({
  /**
   * Get available compliance checklists
   */
  getChecklists: protectedProcedure
    .input(
      z.object({
        region: z.string().optional(),
        businessType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const checklists = await complianceService.getActiveChecklists(
        input.region,
        input.businessType
      );
      return checklists;
    }),

  /**
   * Get specific checklist by ID
   */
  getChecklist: protectedProcedure
    .input(z.object({ checklistId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db
        .select()
        .from(complianceChecklists)
        .where(eq(complianceChecklists.id, input.checklistId))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Initialize compliance tracking for a tenant
   */
  initialize: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        checklistId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      await complianceService.initializeTenantCompliance(
        input.tenantId,
        input.checklistId
      );

      return { success: true };
    }),

  /**
   * Get compliance status for a tenant
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        checklistId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const status = await complianceService.getTenantComplianceStatus(
        input.tenantId,
        input.checklistId
      );

      return status;
    }),

  /**
   * Get compliance statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        checklistId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const stats = await complianceService.getComplianceStats(
        input.tenantId,
        input.checklistId
      );

      return stats;
    }),

  /**
   * Update compliance item status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        complianceId: z.string(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
        notes: z.string().optional(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              uploadedAt: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      await complianceService.updateComplianceStatus(
        input.complianceId,
        input.status,
        ctx.user.id,
        input.notes,
        input.attachments
      );

      return { success: true };
    }),

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        daysAhead: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const deadlines = await complianceService.getUpcomingDeadlines(
        input.tenantId,
        input.daysAhead
      );

      return deadlines;
    }),

  /**
   * Schedule a reminder
   */
  scheduleReminder: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        complianceId: z.string(),
        reminderType: z.enum(['email', 'notification', 'sms']),
        scheduledFor: z.date(),
        message: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const reminderId = await complianceService.scheduleReminder(
        input.tenantId,
        input.complianceId,
        input.reminderType,
        input.scheduledFor,
        input.message,
        input.metadata
      );

      return { reminderId };
    }),

  /**
   * Schedule quarterly tax reminders
   */
  scheduleQuarterlyTaxReminders: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        complianceId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      await complianceService.scheduleQuarterlyTaxReminders(
        input.tenantId,
        input.complianceId
      );

      return { success: true };
    }),

  /**
   * Get full compliance dashboard data
   */
  getDashboard: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      // Get all data in parallel
      const [status, stats, deadlines] = await Promise.all([
        complianceService.getTenantComplianceStatus(input.tenantId),
        complianceService.getComplianceStats(input.tenantId),
        complianceService.getUpcomingDeadlines(input.tenantId, 30),
      ]);

      return {
        status,
        stats,
        upcomingDeadlines: deadlines,
      };
    }),
});

