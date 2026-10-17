import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const stores=sqliteTable('pos_stores',{id:text('id').primaryKey(),version:integer('version').notNull(),payload:text('payload').notNull()});
