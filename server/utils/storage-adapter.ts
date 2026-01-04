// Storage adapter that works without Cloudflare
import type { H3Event } from 'h3'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

let db: Database.Database | null = null

function getDatabase() {
  if (db)
    return db

  // Create data directory
  const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = join(dataDir, 'sink.db')
  console.log('📦 Database path:', dbPath)
  db = new Database(dbPath)

  // Create links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expiration INTEGER,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_expiration ON links(expiration);
    CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at);
  `)

  // Create analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_slug TEXT NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      user_agent TEXT,
      ip TEXT,
      referer TEXT,
      country TEXT,
      city TEXT,
      device TEXT,
      browser TEXT,
      os TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_link_slug ON analytics(link_slug);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON analytics(timestamp);
  `)

  console.log('✅ Database initialized')
  return db
}

// Cloudflare KV compatible interface
export class StorageAdapter {
  private db: Database.Database

  constructor() {
    this.db = getDatabase()
  }

  async get(key: string, options?: { type?: 'text' | 'json' }): Promise<any> {
    const now = Math.floor(Date.now() / 1000)

    const row = this.db.prepare(`
      SELECT value FROM links 
      WHERE key = ? AND (expiration IS NULL OR expiration > ?)
    `).get(key, now) as { value: string } | undefined

    if (!row)
      return null

    if (options?.type === 'json') {
      try {
        return JSON.parse(row.value)
      }
      catch {
        return null
      }
    }

    return row.value
  }

  async getWithMetadata(key: string, options?: { type?: 'text' | 'json' }): Promise<{ value: any, metadata: any }> {
    const now = Math.floor(Date.now() / 1000)

    const row = this.db.prepare(`
      SELECT value, metadata FROM links 
      WHERE key = ? AND (expiration IS NULL OR expiration > ?)
    `).get(key, now) as { value: string, metadata: string | null } | undefined

    if (!row) {
      return { value: null, metadata: null }
    }

    let value = row.value
    if (options?.type === 'json') {
      try {
        value = JSON.parse(row.value)
      }
      catch {
        value = null
      }
    }

    let metadata = null
    if (row.metadata) {
      try {
        metadata = JSON.parse(row.metadata)
      }
      catch {
        metadata = null
      }
    }

    return { value, metadata }
  }

  async put(key: string, value: string, options?: { expiration?: number, expirationTtl?: number, metadata?: any }): Promise<void> {
    let expiration = options?.expiration

    // Handle expirationTtl (seconds from now)
    if (options?.expirationTtl) {
      expiration = Math.floor(Date.now() / 1000) + options.expirationTtl
    }

    const metadata = options?.metadata ? JSON.stringify(options.metadata) : null

    this.db.prepare(`
      INSERT OR REPLACE INTO links (key, value, expiration, metadata)
      VALUES (?, ?, ?, ?)
    `).run(key, value, expiration || null, metadata)
  }

  async delete(key: string): Promise<void> {
    this.db.prepare('DELETE FROM links WHERE key = ?').run(key)
  }

  async list(options?: { prefix?: string, limit?: number, cursor?: string }): Promise<{
    keys: Array<{ name: string, metadata?: any, expiration?: number }>
    list_complete: boolean
    cursor?: string
  }> {
    const now = Math.floor(Date.now() / 1000)
    const limit = options?.limit || 1000
    const prefix = options?.prefix || ''

    const rows = this.db.prepare(`
      SELECT key as name, metadata, expiration FROM links 
      WHERE key LIKE ? || '%' AND (expiration IS NULL OR expiration > ?)
      ORDER BY created_at DESC
      LIMIT ?
    `).all(prefix, now, limit) as Array<{ name: string, metadata: string | null, expiration: number | null }>

    return {
      keys: rows.map((row) => {
        let metadata
        if (row.metadata) {
          try {
            metadata = JSON.parse(row.metadata)
          }
          catch {}
        }

        return {
          name: row.name,
          metadata,
          expiration: row.expiration || undefined,
        }
      }),
      list_complete: true,
      cursor: undefined,
    }
  }

  // Analytics methods
  async logAccess(data: {
    slug: string
    userAgent?: string
    ip?: string
    referer?: string
    country?: string
    city?: string
    device?: string
    browser?: string
    os?: string
  }): Promise<void> {
    this.db.prepare(`
      INSERT INTO analytics (link_slug, user_agent, ip, referer, country, city, device, browser, os)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.slug,
      data.userAgent || null,
      data.ip || null,
      data.referer || null,
      data.country || null,
      data.city || null,
      data.device || null,
      data.browser || null,
      data.os || null,
    )
  }

  async getAnalytics(slug: string, limit = 100): Promise<any[]> {
    return this.db.prepare(`
      SELECT * FROM analytics 
      WHERE link_slug = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(slug, limit) as any[]
  }
}

// Clean up expired entries periodically
function cleanupExpired() {
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const result = db.prepare(`
    DELETE FROM links 
    WHERE expiration IS NOT NULL AND expiration <= ?
  `).run(now)

  if (result.changes > 0) {
    console.log(`🧹 Cleaned up ${result.changes} expired links`)
  }
}

// Run cleanup every hour in production
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupExpired, 60 * 60 * 1000)
}

// Export singleton instance
let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new StorageAdapter()
  }
  return storageInstance
}

// Helper for event context
export function getKV(event: H3Event) {
  // Try Cloudflare KV first if available
  try {
    const { cloudflare } = event.context
    if (cloudflare?.env?.KV) {
      console.log('☁️ Using Cloudflare KV')
      return cloudflare.env.KV
    }
  }
  catch {}

  // Fallback to SQLite
  console.log('💾 Using SQLite storage')
  return getStorage()
}
