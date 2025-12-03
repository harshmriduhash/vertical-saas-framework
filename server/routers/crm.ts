import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { contacts } from '../../drizzle/schema';
import { nanoid } from 'nanoid';
import { eq, and, like, or, desc } from 'drizzle-orm';
import * as tenantService from '../services/tenant';

/**
 * CRM (Contact/Lead Management) router
 */
export const crmRouter = router({
  /**
   * Create a new contact
   */
  create: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.enum(['lead', 'prospect', 'client', 'inactive']).optional(),
        source: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const contactId = nanoid();
      await db.insert(contacts).values({
        id: contactId,
        tenantId: input.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        status: input.status || 'lead',
        source: input.source,
        tags: input.tags as any,
        notes: input.notes,
        customFields: input.customFields as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { contactId };
    }),

  /**
   * List contacts with filtering and search
   */
  list: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        status: z.enum(['lead', 'prospect', 'client', 'inactive']).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db
        .select()
        .from(contacts)
        .where(eq(contacts.tenantId, input.tenantId))
        .orderBy(desc(contacts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Apply filters
      const conditions = [eq(contacts.tenantId, input.tenantId)];

      if (input.status) {
        conditions.push(eq(contacts.status, input.status));
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(
          or(
            like(contacts.firstName, searchPattern),
            like(contacts.lastName, searchPattern),
            like(contacts.email, searchPattern),
            like(contacts.company, searchPattern)
          )!
        );
      }

      const results = await db
        .select()
        .from(contacts)
        .where(and(...conditions))
        .orderBy(desc(contacts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get single contact
   */
  get: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        contactId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.contactId),
            eq(contacts.tenantId, input.tenantId)
          )
        )
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Update contact
   */
  update: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        contactId: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.enum(['lead', 'prospect', 'client', 'inactive']).optional(),
        source: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.company !== undefined) updateData.company = input.company;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.source !== undefined) updateData.source = input.source;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.customFields !== undefined) updateData.customFields = input.customFields;

      await db
        .update(contacts)
        .set(updateData)
        .where(
          and(
            eq(contacts.id, input.contactId),
            eq(contacts.tenantId, input.tenantId)
          )
        );

      return { success: true };
    }),

  /**
   * Delete contact
   */
  delete: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.delete(contacts)
        .where(
          and(
            eq(contacts.id, input.contactId),
            eq(contacts.tenantId, input.tenantId)
          )
        );

      return { success: true };
    }),

  /**
   * Get contact statistics
   */
  stats: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const allContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.tenantId, input.tenantId));

      const stats = {
        total: allContacts.length,
        leads: allContacts.filter(c => c.status === 'lead').length,
        prospects: allContacts.filter(c => c.status === 'prospect').length,
        clients: allContacts.filter(c => c.status === 'client').length,
        inactive: allContacts.filter(c => c.status === 'inactive').length,
      };

      return stats;
    }),
});

