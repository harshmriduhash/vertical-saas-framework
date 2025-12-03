import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as aiService from '../services/ai';
import * as tenantService from '../services/tenant';
import { getDb } from '../db';
import { aiConversations, businessInsights } from '../../drizzle/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';

/**
 * AI-powered features router
 */
export const aiRouter = router({
  /**
   * Chat with AI assistant
   */
  chat: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        conversationId: z.string().optional(),
        message: z.string().min(1),
        type: z.enum(['business_analysis', 'content_generation', 'customer_support', 'general']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get or create conversation
      let conversation;
      if (input.conversationId) {
        const result = await db
          .select()
          .from(aiConversations)
          .where(
            and(
              eq(aiConversations.id, input.conversationId),
              eq(aiConversations.tenantId, input.tenantId)
            )
          )
          .limit(1);
        conversation = result[0];
      }

      const messages = conversation?.messages || [];
      messages.push({
        role: 'user',
        content: input.message,
        timestamp: new Date().toISOString(),
      });

      // Get AI response
      const response = await aiService.chat(messages as any);

      messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });

      // Save conversation
      const conversationId = input.conversationId || nanoid();
      if (conversation) {
        await db
          .update(aiConversations)
          .set({
            messages: messages as any,
            updatedAt: new Date(),
          })
          .where(eq(aiConversations.id, conversationId));
      } else {
        await db.insert(aiConversations).values({
          id: conversationId,
          tenantId: input.tenantId,
          userId: ctx.user.id,
          title: input.message.substring(0, 100),
          type: input.type || 'general',
          messages: messages as any,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return {
        conversationId,
        response,
        messages,
      };
    }),

  /**
   * Analyze business needs and provide recommendations
   */
  analyzeBusinessNeeds: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        currentChallenges: z.array(z.string()),
        goals: z.array(z.string()),
        currentTools: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const analysis = await aiService.analyzeBusinessNeeds({
        businessType: tenant.tenant.businessType,
        currentChallenges: input.currentChallenges,
        goals: input.goals,
        currentTools: input.currentTools,
      });

      // Save insights to database
      const db = await getDb();
      if (db) {
        const insightRecords = analysis.insights.map(insight => ({
          id: nanoid(),
          tenantId: input.tenantId,
          insightType: insight.type as any,
          title: insight.title,
          description: insight.description,
          priority: insight.priority,
          status: 'new' as const,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        if (insightRecords.length > 0) {
          await db.insert(businessInsights).values(insightRecords);
        }
      }

      return analysis;
    }),

  /**
   * Generate content (email, social post, message)
   */
  generateContent: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        type: z.enum(['email', 'social', 'message']),
        purpose: z.string(),
        tone: z.enum(['professional', 'casual', 'friendly']).optional(),
        audience: z.string().optional(),
        keyPoints: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const content = await aiService.generateContent(input.type, {
        purpose: input.purpose,
        tone: input.tone,
        audience: input.audience,
        keyPoints: input.keyPoints,
      });

      return { content };
    }),

  /**
   * Get business insights for tenant
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        status: z.enum(['new', 'viewed', 'in_progress', 'implemented', 'dismissed']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let insights;
      if (input.status) {
        insights = await db
          .select()
          .from(businessInsights)
          .where(and(
            eq(businessInsights.tenantId, input.tenantId),
            eq(businessInsights.status, input.status)
          ))
          .orderBy(desc(businessInsights.createdAt));
      } else {
        insights = await db
          .select()
          .from(businessInsights)
          .where(eq(businessInsights.tenantId, input.tenantId))
          .orderBy(desc(businessInsights.createdAt));
      }
      return insights;
    }),

  /**
   * Update insight status
   */
  updateInsightStatus: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        insightId: z.string(),
        status: z.enum(['new', 'viewed', 'in_progress', 'implemented', 'dismissed']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(businessInsights)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(businessInsights.id, input.insightId),
            eq(businessInsights.tenantId, input.tenantId)
          )
        );

      return { success: true };
    }),

  /**
   * Get conversation history
   */
  getConversations: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify tenant access
      const tenant = await tenantService.getTenantForUser(ctx.user.id, input.tenantId);
      if (!tenant) throw new Error('Unauthorized');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conversations = await db
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.tenantId, input.tenantId))
        .orderBy(desc(aiConversations.updatedAt))
        .limit(50);

      return conversations;
    }),
});

