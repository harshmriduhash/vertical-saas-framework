CREATE TABLE `compliance_checklists` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`version` varchar(20) NOT NULL,
	`region` varchar(100),
	`businessType` varchar(100),
	`sections` json NOT NULL,
	`metadata` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_reminders` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`complianceId` varchar(64) NOT NULL,
	`reminderType` enum('email','notification','sms') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`sent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`message` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `compliance_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_compliance` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`checklistId` varchar(64) NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`status` enum('not_started','in_progress','completed','skipped') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`completedBy` varchar(64),
	`notes` text,
	`attachments` json,
	`nextDueDate` timestamp,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_compliance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `region_idx` ON `compliance_checklists` (`region`);--> statement-breakpoint
CREATE INDEX `business_type_idx` ON `compliance_checklists` (`businessType`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `compliance_reminders` (`tenantId`);--> statement-breakpoint
CREATE INDEX `scheduled_idx` ON `compliance_reminders` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `sent_idx` ON `compliance_reminders` (`sent`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tenant_compliance` (`tenantId`);--> statement-breakpoint
CREATE INDEX `checklist_idx` ON `tenant_compliance` (`checklistId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `tenant_compliance` (`status`);--> statement-breakpoint
CREATE INDEX `due_date_idx` ON `tenant_compliance` (`nextDueDate`);