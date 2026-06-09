CREATE TABLE "languages" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"language_code" text NOT NULL,
	"text" text NOT NULL,
	"source" text,
	"length_category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"language_code" text NOT NULL,
	"word" text NOT NULL,
	"frequency_rank" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_lang_len_idx" ON "quotes" USING btree ("language_code","length_category");--> statement-breakpoint
CREATE INDEX "words_lang_rank_idx" ON "words" USING btree ("language_code","frequency_rank");--> statement-breakpoint
CREATE UNIQUE INDEX "words_lang_word_uniq" ON "words" USING btree ("language_code","word");