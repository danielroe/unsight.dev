import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const repos = sqliteTable('repos', {
  id: integer('id').primaryKey(),
  node_id: text('node_id').notNull(),
  name: text('name').notNull(),
  full_name: text('full_name').notNull(),
  private: integer('private').notNull(),
  indexed: integer('indexed').notNull().default(0),
})

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey(),
  owner: text('owner').notNull(),
  repository: text('repository').notNull(),
  repoId: integer('repo_id').notNull().references(() => repos.id),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  updated_at: text('updated_at').notNull(),
  labels: text('labels'),
  state: text('state').notNull(),
  mtime: integer('mtime').notNull(),
  hash: text('hash').notNull(),
  metadata: text('metadata').notNull(),
  embeddings: text('embeddings').notNull(),
})
