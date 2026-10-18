CREATE TABLE `projects` (
	`user_id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
