import { eq, and, lt, gte } from 'drizzle-orm';
import { getDb } from '../db';
import {
  complianceChecklists,
  tenantCompliance,
  complianceReminders,
  InsertComplianceChecklist,
  InsertTenantCompliance,
  InsertComplianceReminder,
} from '../../drizzle/schema';
import { nanoid } from 'nanoid';

/**
 * Compliance tracking service
 * Manages compliance checklists, tracking, and automated reminders
 */

export interface ComplianceStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completionRate: number;
}

/**
 * Create or update a compliance checklist template
 */
export async function upsertComplianceChecklist(
  data: Omit<InsertComplianceChecklist, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const checklistId = nanoid();
  await db.insert(complianceChecklists).values({
    id: checklistId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return checklistId;
}

/**
 * Get active compliance checklists for a region and business type
 */
export async function getActiveChecklists(
  region?: string,
  businessType?: string
): Promise<Array<typeof complianceChecklists.$inferSelect>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = [eq(complianceChecklists.isActive, true)];

  if (region) {
    conditions.push(eq(complianceChecklists.region, region));
  }

  if (businessType) {
    conditions.push(eq(complianceChecklists.businessType, businessType));
  }

  const results = await db
    .select()
    .from(complianceChecklists)
    .where(and(...conditions));

  return results;
}

/**
 * Initialize compliance tracking for a tenant
 */
export async function initializeTenantCompliance(
  tenantId: string,
  checklistId: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get the checklist
  const checklist = await db
    .select()
    .from(complianceChecklists)
    .where(eq(complianceChecklists.id, checklistId))
    .limit(1);

  if (checklist.length === 0) {
    throw new Error('Checklist not found');
  }

  const sections = checklist[0].sections;
  const complianceRecords: InsertTenantCompliance[] = [];

  // Create tracking records for each item
  for (const section of sections) {
    for (const item of section.items) {
      const record: InsertTenantCompliance = {
        id: nanoid(),
        tenantId,
        checklistId,
        itemId: item.id,
        status: 'not_started',
        notes: null,
        attachments: null,
        completedAt: null,
        completedBy: null,
        nextDueDate: item.dueDate ? new Date(item.dueDate) : null,
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      complianceRecords.push(record);
    }
  }

  if (complianceRecords.length > 0) {
    await db.insert(tenantCompliance).values(complianceRecords);
  }
}

/**
 * Get compliance status for a tenant
 */
export async function getTenantComplianceStatus(
  tenantId: string,
  checklistId?: string
): Promise<Array<typeof tenantCompliance.$inferSelect>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = [eq(tenantCompliance.tenantId, tenantId)];

  if (checklistId) {
    conditions.push(eq(tenantCompliance.checklistId, checklistId));
  }

  const results = await db
    .select()
    .from(tenantCompliance)
    .where(and(...conditions));

  return results;
}

/**
 * Update compliance item status
 */
export async function updateComplianceStatus(
  complianceId: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped',
  userId: string,
  notes?: string,
  attachments?: Array<{ name: string; url: string; uploadedAt: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'completed') {
    updateData.completedAt = new Date();
    updateData.completedBy = userId;
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  if (attachments !== undefined) {
    updateData.attachments = attachments;
  }

  await db
    .update(tenantCompliance)
    .set(updateData)
    .where(eq(tenantCompliance.id, complianceId));
}

/**
 * Get compliance statistics for a tenant
 */
export async function getComplianceStats(
  tenantId: string,
  checklistId?: string
): Promise<ComplianceStats> {
  const items = await getTenantComplianceStatus(tenantId, checklistId);
  const now = new Date();

  const stats: ComplianceStats = {
    total: items.length,
    completed: items.filter(i => i.status === 'completed').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    notStarted: items.filter(i => i.status === 'not_started').length,
    overdue: items.filter(i => 
      i.nextDueDate && 
      new Date(i.nextDueDate) < now && 
      i.status !== 'completed' &&
      i.status !== 'skipped'
    ).length,
    completionRate: 0,
  };

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }

  return stats;
}

/**
 * Schedule a compliance reminder
 */
export async function scheduleReminder(
  tenantId: string,
  complianceId: string,
  reminderType: 'email' | 'notification' | 'sms',
  scheduledFor: Date,
  message: string,
  metadata?: Record<string, any>
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const reminderId = nanoid();
  await db.insert(complianceReminders).values({
    id: reminderId,
    tenantId,
    complianceId,
    reminderType,
    scheduledFor,
    message,
    metadata: metadata || {},
    sent: false,
    sentAt: null,
    createdAt: new Date(),
  });

  return reminderId;
}

/**
 * Get pending reminders that need to be sent
 */
export async function getPendingReminders(): Promise<
  Array<typeof complianceReminders.$inferSelect>
> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();

  const results = await db
    .select()
    .from(complianceReminders)
    .where(
      and(
        eq(complianceReminders.sent, false),
        lt(complianceReminders.scheduledFor, now)
      )
    );

  return results;
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(complianceReminders)
    .set({
      sent: true,
      sentAt: new Date(),
    })
    .where(eq(complianceReminders.id, reminderId));
}

/**
 * Get upcoming deadlines for a tenant
 */
export async function getUpcomingDeadlines(
  tenantId: string,
  daysAhead: number = 30
): Promise<Array<{
  compliance: typeof tenantCompliance.$inferSelect;
  daysUntilDue: number;
}>> {
  const items = await getTenantComplianceStatus(tenantId);
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const upcoming = items
    .filter(item => 
      item.nextDueDate &&
      new Date(item.nextDueDate) >= now &&
      new Date(item.nextDueDate) <= futureDate &&
      item.status !== 'completed' &&
      item.status !== 'skipped'
    )
    .map(item => {
      const dueDate = new Date(item.nextDueDate!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        compliance: item,
        daysUntilDue,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return upcoming;
}

/**
 * Auto-schedule reminders for quarterly tax deadlines
 */
export async function scheduleQuarterlyTaxReminders(
  tenantId: string,
  complianceId: string
): Promise<void> {
  const currentYear = new Date().getFullYear();
  const quarters = [
    { date: new Date(currentYear, 3, 15), name: 'Q1' }, // April 15
    { date: new Date(currentYear, 5, 15), name: 'Q2' }, // June 15
    { date: new Date(currentYear, 8, 15), name: 'Q3' }, // September 15
    { date: new Date(currentYear + 1, 0, 15), name: 'Q4' }, // January 15 next year
  ];

  const now = new Date();

  for (const quarter of quarters) {
    if (quarter.date > now) {
      // Schedule reminder 7 days before
      const reminderDate = new Date(quarter.date);
      reminderDate.setDate(reminderDate.getDate() - 7);

      await scheduleReminder(
        tenantId,
        complianceId,
        'email',
        reminderDate,
        `Reminder: ${quarter.name} estimated taxes are due on ${quarter.date.toLocaleDateString()}`,
        { quarter: quarter.name, dueDate: quarter.date.toISOString() }
      );
    }
  }
}

/**
 * Calculate next due date for recurring compliance items
 */
export function calculateNextDueDate(
  frequency: 'once' | 'quarterly' | 'annually' | 'monthly',
  lastDueDate?: Date
): Date | null {
  if (frequency === 'once') {
    return null;
  }

  const baseDate = lastDueDate || new Date();
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

