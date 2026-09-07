import "server-only"
import { getDb, LANG } from "./db"

/**
 * Blog posts, categories and comments — the Laravel Blog module's tables, with
 * the same split between a row and its per-language translation row.
 *
 * `blogs.status` and `blog_categories.status` are 1/0 (published/hidden), and
 * `blog_comments.status` is 1/0 (approved/pending), matching Laravel exactly.
 */

export interface BlogCategory {
  id: number
  slug: string
  status: number
  created_at: string | null
  // joined
  name: string | null
  post_count?: number
}

export interface BlogPost {
  id: number
  admin_id: number | null
  slug: string
  blog_category_id: number | null
  image: string | null
  views: number
  status: number
  is_popular: string
  tags: string | null
  created_at: string | null
  updated_at: string | null
  // joined
  title: string | null
  description: string | null
  seo_title: string | null
  seo_description: string | null
  category_name: string | null
  category_slug: string | null
  comment_count?: number
}

export interface BlogComment {
  id: number
  blog_id: number | null
  name: string
  email: string | null
  phone: string | null
  comment: string
  status: number
  created_at: string | null
  // joined
  post_title: string | null
  post_slug: string | null
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

export function slugify(value: string, fallback = "post"): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  )
}

function uniqueSlug(table: string, base: string, ignoreId?: number): string {
  const db = getDb()
  const root = slugify(base)
  let slug = root
  let n = 1
  for (;;) {
    const clash = db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ? LIMIT 1`).get(slug, ignoreId ?? 0)
    if (!clash) return slug
    slug = `${root}-${++n}`
  }
}

/* ---- categories ------------------------------------------------------- */

const CATEGORY_SELECT = `
  SELECT c.*, t.name,
         (SELECT COUNT(*) FROM blogs b WHERE b.blog_category_id = c.id) AS post_count
  FROM blog_categories c
  LEFT JOIN blog_category_translations t ON t.blog_category_id = c.id AND t.lang_code = ?
`

export function getBlogCategories(onlyPublished = false): BlogCategory[] {
  return getDb()
    .prepare(`${CATEGORY_SELECT} ${onlyPublished ? "WHERE c.status = 1" : ""} ORDER BY t.name`)
    .all(LANG) as unknown as BlogCategory[]
}

export function getBlogCategory(id: number): BlogCategory | null {
  const row = getDb().prepare(`${CATEGORY_SELECT} WHERE c.id = ? LIMIT 1`).get(LANG, id) as unknown as
    | BlogCategory
    | undefined
  return row ?? null
}

export function createBlogCategory(name: string, status: boolean): number {
  const db = getDb()
  const ts = now()
  const id = Number(
    db
      .prepare("INSERT INTO blog_categories (slug, status, created_at, updated_at) VALUES (?,?,?,?)")
      .run(uniqueSlug("blog_categories", name, undefined), status ? 1 : 0, ts, ts).lastInsertRowid,
  )
  db.prepare(
    `INSERT INTO blog_category_translations (blog_category_id, lang_code, name, created_at, updated_at)
     VALUES (?,?,?,?,?)`,
  ).run(id, LANG, name, ts, ts)
  return id
}

export function updateBlogCategory(id: number, name: string, status: boolean): void {
  const db = getDb()
  const ts = now()
  db.prepare("UPDATE blog_categories SET slug = ?, status = ?, updated_at = ? WHERE id = ?").run(
    uniqueSlug("blog_categories", name, id),
    status ? 1 : 0,
    ts,
    id,
  )

  const existing = db
    .prepare("SELECT id FROM blog_category_translations WHERE blog_category_id = ? AND lang_code = ?")
    .get(id, LANG) as { id: number } | undefined

  if (existing) {
    db.prepare("UPDATE blog_category_translations SET name = ?, updated_at = ? WHERE id = ?").run(name, ts, existing.id)
  } else {
    db.prepare(
      `INSERT INTO blog_category_translations (blog_category_id, lang_code, name, created_at, updated_at)
       VALUES (?,?,?,?,?)`,
    ).run(id, LANG, name, ts, ts)
  }
}

/** Laravel blocks the delete while posts still sit in the category. */
export function deleteBlogCategory(id: number): { ok: boolean; error?: string } {
  const db = getDb()
  const posts = (db.prepare("SELECT COUNT(*) AS n FROM blogs WHERE blog_category_id = ?").get(id) as { n: number }).n
  if (posts > 0) {
    return { ok: false, error: `${posts} post${posts === 1 ? "" : "s"} still use this category. Move them first.` }
  }
  db.prepare("DELETE FROM blog_category_translations WHERE blog_category_id = ?").run(id)
  db.prepare("DELETE FROM blog_categories WHERE id = ?").run(id)
  return { ok: true }
}

/* ---- posts ------------------------------------------------------------ */

const POST_SELECT = `
  SELECT b.*, t.title, t.description, t.seo_title, t.seo_description,
         ct.name AS category_name, c.slug AS category_slug,
         (SELECT COUNT(*) FROM blog_comments bc WHERE bc.blog_id = b.id AND bc.status = 1) AS comment_count
  FROM blogs b
  LEFT JOIN blog_translations t ON t.blog_id = b.id AND t.lang_code = ?
  LEFT JOIN blog_categories c ON c.id = b.blog_category_id
  LEFT JOIN blog_category_translations ct ON ct.blog_category_id = b.blog_category_id AND ct.lang_code = ?
`

export interface BlogFilters {
  category?: string
  q?: string
  limit?: number
  offset?: number
}

export function getPublishedPosts(filters: BlogFilters = {}): { posts: BlogPost[]; total: number } {
  const db = getDb()
  const where = ["b.status = 1"]
  const params: (string | number)[] = [LANG, LANG]

  if (filters.category) {
    where.push("c.slug = ?")
    params.push(filters.category)
  }
  if (filters.q) {
    where.push("(t.title LIKE ? OR b.tags LIKE ?)")
    params.push(`%${filters.q}%`, `%${filters.q}%`)
  }

  const whereSql = `WHERE ${where.join(" AND ")}`
  const limit = Math.min(Math.max(filters.limit ?? 9, 1), 50)
  const offset = Math.max(filters.offset ?? 0, 0)

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM blogs b
         LEFT JOIN blog_translations t ON t.blog_id = b.id AND t.lang_code = ?
         LEFT JOIN blog_categories c ON c.id = b.blog_category_id
         ${whereSql}`,
      )
      .get(...[LANG, ...params.slice(2)]) as { n: number } | undefined
  )?.n ?? 0

  const posts = db
    .prepare(`${POST_SELECT} ${whereSql} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as unknown as BlogPost[]

  return { posts, total }
}

export function getAllPostsForAdmin(): BlogPost[] {
  return getDb().prepare(`${POST_SELECT} ORDER BY b.created_at DESC`).all(LANG, LANG) as unknown as BlogPost[]
}

export function getPostBySlug(slug: string): BlogPost | null {
  const row = getDb()
    .prepare(`${POST_SELECT} WHERE b.slug = ? AND b.status = 1 LIMIT 1`)
    .get(LANG, LANG, slug) as unknown as BlogPost | undefined
  return row ?? null
}

export function getPostById(id: number): BlogPost | null {
  const row = getDb().prepare(`${POST_SELECT} WHERE b.id = ? LIMIT 1`).get(LANG, LANG, id) as unknown as
    | BlogPost
    | undefined
  return row ?? null
}

export function getPopularPosts(limit = 4): BlogPost[] {
  return getDb()
    .prepare(`${POST_SELECT} WHERE b.status = 1 ORDER BY b.views DESC, b.created_at DESC LIMIT ?`)
    .all(LANG, LANG, limit) as unknown as BlogPost[]
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getDb()
    .prepare(
      `${POST_SELECT} WHERE b.status = 1 AND b.id != ?
       ORDER BY (b.blog_category_id = ?) DESC, b.created_at DESC LIMIT ?`,
    )
    .all(LANG, LANG, post.id, post.blog_category_id ?? 0, limit) as unknown as BlogPost[]
}

export function incrementPostViews(id: number): void {
  try {
    getDb().prepare("UPDATE blogs SET views = views + 1 WHERE id = ?").run(id)
  } catch {
    // A view counter is never worth failing a page render over.
  }
}

export interface BlogInput {
  title: string
  description: string
  seo_title: string | null
  seo_description: string | null
  blog_category_id: number | null
  image: string | null
  tags: string | null
  is_popular: boolean
  status: boolean
}

export function createPost(input: BlogInput, adminId: number): number {
  const db = getDb()
  const ts = now()
  const id = Number(
    db
      .prepare(
        `INSERT INTO blogs (admin_id, slug, blog_category_id, image, views, status, is_popular, tags, created_at, updated_at)
         VALUES (?,?,?,?,0,?,?,?,?,?)`,
      )
      .run(
        adminId,
        uniqueSlug("blogs", input.title),
        input.blog_category_id,
        input.image,
        input.status ? 1 : 0,
        input.is_popular ? "yes" : "no",
        input.tags,
        ts,
        ts,
      ).lastInsertRowid,
  )

  db.prepare(
    `INSERT INTO blog_translations (blog_id, lang_code, title, description, seo_title, seo_description, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(id, LANG, input.title, input.description, input.seo_title || input.title, input.seo_description || input.title, ts, ts)

  return id
}

export function updatePost(id: number, input: BlogInput): void {
  const db = getDb()
  const ts = now()

  db.prepare(
    `UPDATE blogs SET slug = ?, blog_category_id = ?, image = ?, status = ?, is_popular = ?, tags = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    uniqueSlug("blogs", input.title, id),
    input.blog_category_id,
    input.image,
    input.status ? 1 : 0,
    input.is_popular ? "yes" : "no",
    input.tags,
    ts,
    id,
  )

  const existing = db.prepare("SELECT id FROM blog_translations WHERE blog_id = ? AND lang_code = ?").get(id, LANG) as
    | { id: number }
    | undefined

  const seoTitle = input.seo_title || input.title
  const seoDescription = input.seo_description || input.title

  if (existing) {
    db.prepare(
      "UPDATE blog_translations SET title = ?, description = ?, seo_title = ?, seo_description = ?, updated_at = ? WHERE id = ?",
    ).run(input.title, input.description, seoTitle, seoDescription, ts, existing.id)
  } else {
    db.prepare(
      `INSERT INTO blog_translations (blog_id, lang_code, title, description, seo_title, seo_description, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(id, LANG, input.title, input.description, seoTitle, seoDescription, ts, ts)
  }
}

export function deletePost(id: number): void {
  const db = getDb()
  db.prepare("DELETE FROM blog_comments WHERE blog_id = ?").run(id)
  db.prepare("DELETE FROM blog_translations WHERE blog_id = ?").run(id)
  db.prepare("DELETE FROM blogs WHERE id = ?").run(id)
}

export function setPostStatus(id: number, status: boolean): void {
  getDb().prepare("UPDATE blogs SET status = ?, updated_at = ? WHERE id = ?").run(status ? 1 : 0, now(), id)
}

/* ---- comments --------------------------------------------------------- */

const COMMENT_SELECT = `
  SELECT bc.*, t.title AS post_title, b.slug AS post_slug
  FROM blog_comments bc
  LEFT JOIN blogs b ON b.id = bc.blog_id
  LEFT JOIN blog_translations t ON t.blog_id = bc.blog_id AND t.lang_code = ?
`

export function getComments(status?: number): BlogComment[] {
  const where = typeof status === "number" ? "WHERE bc.status = ?" : ""
  const args: (string | number)[] = typeof status === "number" ? [LANG, status] : [LANG]
  return getDb().prepare(`${COMMENT_SELECT} ${where} ORDER BY bc.id DESC`).all(...args) as unknown as BlogComment[]
}

export function getApprovedComments(blogId: number): BlogComment[] {
  return getDb()
    .prepare(`${COMMENT_SELECT} WHERE bc.blog_id = ? AND bc.status = 1 ORDER BY bc.id DESC`)
    .all(LANG, blogId) as unknown as BlogComment[]
}

export function countPendingComments(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM blog_comments WHERE status = 0").get() as
    | { n: number }
    | undefined
  return row?.n ?? 0
}

export function addComment(input: {
  blog_id: number
  name: string
  email: string
  phone: string | null
  comment: string
}): number {
  const ts = now()
  const info = getDb()
    .prepare(
      `INSERT INTO blog_comments (blog_id, name, email, phone, comment, status, created_at, updated_at)
       VALUES (?,?,?,?,?,0,?,?)`,
    )
    .run(input.blog_id, input.name, input.email, input.phone, input.comment, ts, ts)
  return Number(info.lastInsertRowid)
}

export function setCommentStatus(id: number, approved: boolean): void {
  getDb().prepare("UPDATE blog_comments SET status = ?, updated_at = ? WHERE id = ?").run(approved ? 1 : 0, now(), id)
}

export function deleteComment(id: number): void {
  getDb().prepare("DELETE FROM blog_comments WHERE id = ?").run(id)
}

/** Slugs and change dates for every published post — used by the sitemap. */
export function getPublishedPostSlugs(): { slug: string; updated_at: string | null }[] {
  return getDb()
    .prepare("SELECT slug, updated_at FROM blogs WHERE status = 1 ORDER BY created_at DESC")
    .all() as unknown as { slug: string; updated_at: string | null }[]
}
