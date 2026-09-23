import { sql } from 'drizzle-orm'
import { boolean, check, integer, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const appPrivate = pgSchema('app_private')

export const categories = appPrivate.table('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const courses = appPrivate.table('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  nameTh: text('name_th').notNull(),
  categoryName: text('category_name').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  status: text('status').notNull().default('approved'),
}, (table) => [
  check('courses_status_check', sql`${table.status} in ('approved', 'archived')`),
])

export const offerings = appPrivate.table('offerings', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  academicYear: integer('academic_year').notNull(),
  semester: text('semester').notNull(),
  section: text('section').notNull(),
  instructorName: text('instructor_name'),
  status: text('status').notNull().default('approved'),
}, (table) => [
  check('offerings_status_check', sql`${table.status} in ('approved', 'pending', 'rejected')`),
  unique('offerings_course_period_section_unique').on(table.courseId, table.academicYear, table.semester, table.section),
])

export const reviews = appPrivate.table('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorUserId: text('author_user_id').notNull(),
  offeringId: uuid('offering_id').notNull().references(() => offerings.id),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  authorActive: boolean('author_active').notNull().default(true),
  moderationVisible: boolean('moderation_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('reviews_rating_check', sql`${table.rating} between 1 and 5`),
  check('reviews_text_check', sql`length(btrim(${table.text})) > 0`),
  unique('reviews_author_offering_unique').on(table.authorUserId, table.offeringId),
])

export const roleMemberships = appPrivate.table('role_memberships', {
  userId: uuid('user_id').primaryKey(),
  role: text('role').notNull(),
  grantedBy: uuid('granted_by'),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('role_memberships_role_check', sql`${table.role} in ('owner', 'administrator')`),
])

export const roleAudit = appPrivate.table('role_audit', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').notNull(),
  targetUserId: uuid('target_user_id').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('role_audit_action_check', sql`${table.action} in ('bootstrap_owner', 'grant_administrator', 'revoke_administrator')`),
])
