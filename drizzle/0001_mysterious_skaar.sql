CREATE TABLE `ai_conversations` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`title` varchar(255),
	`type` enum('business_analysis','content_generation','customer_support','general') NOT NULL,
	`messages` json NOT NULL,
	`metadata` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`userId` varchar(64),
	`eventType` varchar(100) NOT NULL,
	`eventData` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`contactId` varchar(64),
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` varchar(500),
	`status` enum('scheduled','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`reminderSent` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` json NOT NULL,
	`actions` json NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRun` timestamp,
	`runCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_insights` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`insightType` enum('efficiency_opportunity','revenue_prediction','client_churn_risk','automation_suggestion','growth_opportunity') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('new','viewed','in_progress','implemented','dismissed') NOT NULL DEFAULT 'new',
	`data` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`company` varchar(255),
	`status` enum('lead','prospect','client','inactive') NOT NULL DEFAULT 'lead',
	`source` varchar(100),
	`tags` json,
	`notes` text,
	`customFields` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`provider` enum('stripe','paypal','google_drive','google_calendar','slack','mailchimp','sendgrid','twilio') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`credentials` json,
	`config` json,
	`lastSync` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_idx` UNIQUE(`tenantId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`contactId` varchar(64),
	`invoiceNumber` varchar(50) NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`issueDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`items` json NOT NULL,
	`notes` text,
	`paidAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_number_idx` UNIQUE(`tenantId`,`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `tenant_modules` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`moduleType` enum('crm','scheduling','invoicing','website_builder','marketing','analytics','ai_assistant','project_management','file_storage','email_campaigns') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`config` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `module_idx` UNIQUE(`tenantId`,`moduleType`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`ownerId` varchar(64) NOT NULL,
	`businessType` enum('photographer','musician','artist','content_creator','real_estate_agent','designer','writer','consultant','other') NOT NULL,
	`subscriptionTier` enum('free','starter','professional','enterprise') NOT NULL DEFAULT 'free',
	`subscriptionStatus` enum('active','trial','cancelled','past_due') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`customDomain` varchar(255),
	`settings` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_tenants` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `user_tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_tenant_idx` UNIQUE(`userId`,`tenantId`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `ai_conversations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `ai_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `analytics_events` (`tenantId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `analytics_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `analytics_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `appointments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `contact_idx` ON `appointments` (`contactId`);--> statement-breakpoint
CREATE INDEX `start_time_idx` ON `appointments` (`startTime`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `automations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `enabled_idx` ON `automations` (`enabled`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `business_insights` (`tenantId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `business_insights` (`status`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `business_insights` (`priority`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `contacts` (`tenantId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `contacts` (`status`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `integrations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `invoices` (`tenantId`);--> statement-breakpoint
CREATE INDEX `contact_idx` ON `invoices` (`contactId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tenant_modules` (`tenantId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `tenants` (`ownerId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_tenants` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `user_tenants` (`tenantId`);