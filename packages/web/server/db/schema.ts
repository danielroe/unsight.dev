import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const repos = sqliteTable('repos', {
  id: integer('id').primaryKey(),
  node_id: text('node_id').notNull(),
  full_name: text('full_name').notNull().unique(),
  private: integer('private').notNull(),
  indexed: integer('indexed').notNull().default(0),
})

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repoId: integer('repo_id').notNull().references(() => repos.id),
  title: text('title').notNull(),
  state: text('state').notNull(),
  number: integer('number').notNull(),
  metadata: text('metadata').notNull(),
  embeddings: text('embeddings').notNull(),
  hash: text('hash').notNull(),
  mtime: integer('mtime').notNull(),
}, table => [
  index('idx_repo_id_number').on(table.repoId, table.number),
  index('idx_state').on(table.state),
])
