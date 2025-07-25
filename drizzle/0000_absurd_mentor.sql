CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`model_name` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `model_name_idx` ON `chats` (`model_name`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `chats` (`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_id_idx` ON `messages` (`chat_id`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `messages` (`order`);