# Incident Retrieval Schema Repair — LU 2.11 Assignment

## What This Is

The platform is shipping its first AI feature: surface the **three most similar past incidents** when a responder opens a new one. A colleague drafted the **retrieval schema** — the `incident_chunks` table that holds embedded incident text for vector similarity search — in `migrations/001_retrieval_schema.sql`. It has **intentional errors**: the embedding is stored as plain `TEXT` instead of a `vector`, the foreign key is the wrong type with no `ON DELETE`, the filter-metadata columns are missing, there are no indexes, and a rejected shape (a single embedding column on `incidents`) made it in.

Your job: **fix the retrieval schema so it correctly implements the retrieval spec** in the assignment question. The spec is the source of truth.

When you're done, all **20 pgTAP tests** must pass.

---

## Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| PostgreSQL (v14+) | Runs the test database | `psql --version` |
| **pgvector** | Provides the `vector` type and HNSW index | `SELECT '[1,2,3]'::vector;` |
| pgTAP | Test framework for schema validation | `pg_prove --version` |
| pg_prove | pgTAP test runner | comes with pgTAP |
| Node.js + npm | Runs the helper scripts | `node --version` |

### Easiest setup — Docker (Postgres + pgvector preinstalled)

```bash
docker run --name incident-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d pgvector/pgvector:pg16
```

### Installing pgvector manually

**macOS (Homebrew):**
```bash
brew install pgvector
```

**Ubuntu / Debian:**
```bash
sudo apt-get install postgresql-16-pgvector   # match your postgres version
```

### Installing pgTAP

**macOS:** `brew install pgtap` · **Ubuntu:** `sudo apt-get install postgresql-16-pgtap`

Both extensions are enabled automatically by `npm run db:reset` (it runs `CREATE EXTENSION IF NOT EXISTS vector;` and `CREATE EXTENSION IF NOT EXISTS pgtap;`).

---

## Setup

### Step 1: Clone or fork the repo

```bash
git clone <repo-url>
cd incident-retrieval-repair
```

### Step 2: Make sure PostgreSQL (with pgvector) is running

```bash
# Docker
docker start incident-pg
# or local service: brew services start postgresql / sudo service postgresql start
```

### Step 3: Create the test database and apply the schema

```bash
npm run db:reset
```

This drops `incident_retrieval_test`, recreates it, enables the `vector` and `pgtap` extensions, and applies `migrations/001_retrieval_schema.sql`.

> ⚠️ "role does not exist" → add `-U postgres` to each `psql` command in the `db:reset` script in `package.json`.

### Step 4: Run the tests

```bash
npm test
```

The first run **fails most tests** — the schema is broken. Fix it until all 20 pass.

---

## What the Tests Check

| Category | Tests | What they check |
|----------|-------|-----------------|
| Table existence | 2 | `incidents` and `incident_chunks` exist |
| Column types | 7 | `id`/`incident_id`/`team_id` are BIGINT, `embedding` is `vector(1536)` (not TEXT), `created_at` is TIMESTAMPTZ |
| NOT NULL | 6 | `incident_id`, `chunk_text`, `embedding`, `team_id`, `severity`, `created_at` are required |
| Foreign key | 1 | `incident_chunks.incident_id` references `incidents.id` |
| Indexes | 2 | HNSW ANN index on `embedding`; B-tree index on `incident_id` |
| Rejected shape | 1 | `incidents.embedding` column is gone |
| ON DELETE CASCADE | 1 | deleting an incident removes its chunks |

---

## The File to Fix

**Only edit this file:**

```
migrations/001_retrieval_schema.sql
```

Every broken line has a `-- wrong:` or `-- MISSING:` comment. Read each one.

---

## Hints

Work top to bottom.

**Hint 1 — Enable pgvector first.**
Add `CREATE EXTENSION IF NOT EXISTS vector;` at the very top. Without it, `vector(1536)` will error with `type "vector" does not exist`.

**Hint 2 — The embedding is a vector, not text.**
`embedding TEXT` → `embedding vector(1536) NOT NULL`. A stringified vector cannot be indexed or compared with the `<=>` cosine-distance operator. The whole point of retrieval storage is the native vector type.

**Hint 3 — The FK type and ON DELETE.**
`incidents.id` is `BIGSERIAL` (a `bigint`), so the FK must be `BIGINT`, not `INTEGER`. A chunk has no meaning without its incident, so the behaviour is `ON DELETE CASCADE`:
`incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`.

**Hint 4 — Add the filter metadata.**
Hybrid retrieval filters by team and severity alongside the similarity ranking. Add `team_id BIGINT NOT NULL` and `severity TEXT NOT NULL` to `incident_chunks`. These are denormalised copies — a deliberate, access-pattern-driven choice (LU16).

**Hint 5 — Timestamps.**
`created_at` should be `TIMESTAMPTZ NOT NULL DEFAULT now()`.

**Hint 6 — Remove the rejected shape.**
Delete the `ALTER TABLE incidents ADD COLUMN embedding TEXT;` line. One embedding per incident cannot represent a long, multi-paragraph description — you need multiple chunks per incident, each its own vector. That is exactly why `incident_chunks` exists (one-to-many from `incidents`).

**Hint 7 — Add both indexes.**
```sql
CREATE INDEX idx_incident_chunks_embedding
  ON incident_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_incident_chunks_incident_id
  ON incident_chunks (incident_id);
```

---

## Workflow

```bash
# 1. Edit the schema
nano migrations/001_retrieval_schema.sql

# 2. Re-apply from scratch
npm run db:reset

# 3. Run the tests
npm test

# 4. Repeat until all 20 pass
```

---

## Common Errors

**`ERROR: type "vector" does not exist`**
→ Add `CREATE EXTENSION IF NOT EXISTS vector;` at the top of the SQL file (and make sure pgvector is installed — use the Docker image if unsure).

**`ERROR: access method "hnsw" does not exist`**
→ Your pgvector version is too old (HNSW needs pgvector ≥ 0.5.0). Update pgvector, or use `ivfflat` only if your environment requires it — but the tests expect the index named `idx_incident_chunks_embedding` to exist.

**`ERROR: foreign key constraint ... cannot be implemented` / type mismatch**
→ The FK column type must match the referenced PK type. `incidents.id` is `bigint`, so `incident_id` must be `BIGINT`, not `INTEGER`.

**`ERROR: column "embedding" of relation "incidents" does not exist`** (in tests)
→ Good — that means you removed the rejected shape. The `hasnt_column` test wants it gone.

**`pg_prove: command not found`** → pgTAP isn't installed or on PATH. See prerequisites.

**`psql: error: connection to server failed`** → PostgreSQL isn't running.

---

## Submission

Once all 20 tests pass:

1. Commit to a branch called `retrieval-schema-repair`:
```bash
git checkout -b retrieval-schema-repair
git add migrations/001_retrieval_schema.sql README.md
git commit -m "fix: repair the incident retrieval schema to match the spec"
```

2. Completed **3 retrieval-model decisions** and **1 rejected shape**:

## Retrieval-Model Decisions

### Decision 1: Native Vector Column Type (`vector(1536) NOT NULL`) vs Plain Text or Array
Spec said: `embedding vector(1536) NOT NULL` — the embedding vector (pgvector type).
Schema decided: Enabled the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`) and declared `incident_chunks.embedding` as `vector(1536) NOT NULL`.
Reason: Storing high-dimensional embeddings as `TEXT` or `float8[]` breaks retrieval storage in three fundamental ways:
1. **Distance Operators:** The `<=>` cosine-distance operator in PostgreSQL operates exclusively on native pgvector types. Storing vectors as `TEXT` or arrays eliminates native SQL geometric operators, forcing the application to retrieve raw strings and compute distances in memory.
2. **Approximate Nearest Neighbor (ANN) Indexing:** `HNSW` indexing requires a native `vector` column paired with an operator class (`vector_cosine_ops`). You cannot build an HNSW index on `TEXT` or `float8[]`, degrading all retrieval queries from $O(\log n)$ to an $O(n)$ full table scan.
3. **Dimensionality Guarantee:** The `vector(1536)` type strictly enforces at the database constraint layer that every row contains exactly 1,536 dimensions. `TEXT` or arrays allow malformed or mis-dimensioned vectors that silently corrupt vector space arithmetic and similarity rankings. Adding `NOT NULL` prevents unsearchable dead chunks, as an un-embedded chunk can never be retrieved.

### Decision 2: Foreign Key Cascade Behavior (`ON DELETE CASCADE`) on Derived Data
Spec said: `incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE` — a chunk has no meaning without its incident.
Schema decided: Declared `incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE` on `incident_chunks` along with a supporting B-tree index (`idx_incident_chunks_incident_id`).
Reason: `incident_chunks` contains derived, cached retrieval representations of authoritative incidents. A chunk has no semantic meaning or lifecycle outside its parent incident:
1. **Preventing Orphan Vectors:** If `ON DELETE SET NULL` were allowed, deleting an incident would leave orphaned chunks with `NULL` incident IDs in the index. Vector similarity searches would match these chunks and return them to the LLM assistant, citing incidents that no longer exist in the authoritative table (the orphan-vector defect).
2. **Preventing Deletion Deadlocks:** If `ON DELETE RESTRICT` (or default `NO ACTION`) were used, deleting an incident would fail unless an operator or background worker manually purged all associated chunks first. Derived data must never gate or hold hostage operations on the authoritative source of truth.
3. **Type Compatibility & Indexing:** `incidents.id` is `BIGSERIAL` (`bigint`), so `incident_id` must match as `BIGINT` to allow foreign key validation. A B-tree index on `incident_id` ensures that cascade deletions and re-embedding sweeps do not perform full scans on `incident_chunks`.

### Decision 3: Denormalised Filter Metadata (`team_id` and `severity`) for Hybrid Retrieval
Spec said: `team_id BIGINT NOT NULL` and `severity TEXT NOT NULL` — denormalised filter metadata.
Schema decided: Copied `team_id BIGINT NOT NULL` and `severity TEXT NOT NULL` from `incidents` directly into `incident_chunks`.
Reason: Fireline's retrieval query is hybrid retrieval: "find the 3 most similar past P1 incidents for the same team, excluding the current one, on every incident open."
1. **Single-Pass Filtered Vector Search:** In PostgreSQL with pgvector, storing relational filter columns (`team_id`, `severity`) directly on `incident_chunks` enables the query planner to apply relational filter predicates (`WHERE team_id = $1 AND severity = $2 AND incident_id <> $3`) and vector similarity ranking (`ORDER BY embedding <=> $4 LIMIT 3`) in a unified, single-table execution plan.
2. **Eliminating Cross-Table Join Overhead:** If metadata were left normalized solely in `incidents`, every similarity query would require joining millions of candidate vector rows against `incidents` or performing two-phase multi-query retrieval (over-fetching candidates and filtering after the fact). At high frequency (~8,000 queries/min peak), eliminating this join directly protects retrieval latency.
3. **Explicit Trade-Off:** As established in LU16, denormalisation trades write-path overhead for read-path performance. If an incident's team or severity changes, chunks must be updated or re-embedded. For an incident management platform where incident metadata updates are rare relative to incident opens and retrieval reads, this trade-off is optimal.

## Rejected Shape

### Shape: Single Embedding Column on `incidents` (`ALTER TABLE incidents ADD COLUMN embedding TEXT;`)
What it was: A single embedding column (`embedding TEXT`) bolted directly onto the authoritative `incidents` table, attempting to represent each entire incident as a single vector.
Why rejected: Incidents are complex, multi-topic documents spanning multiple paragraphs (e.g., initial alert symptoms, stack traces, investigation steps, hypothesis testing, root cause identification, and mitigation). An embedding vector represents the semantic centroid (average) of the entire input text. Furthermore, embedding models have strict input token limits (e.g., 512–8,192 tokens); long incidents exceed this limit and suffer silent truncation, discarding vital troubleshooting and resolution history.
What would break: **Retrieval Granularity Failure and Semantic Dilution (Blurred Meaning):**
1. **Semantic Dilution:** Compressing an entire incident into a single vector averages out specific technical details. When a responder searches with a precise technical symptom (e.g., "Postgres connection pool exhausted under load"), an incident whose root cause or 4th paragraph discusses this exact issue will match poorly because its single vector is dominated by paragraphs describing generic alert timestamps and communication updates.
2. **Loss of Specificity:** The LLM receives either the whole bloated incident or nothing, losing the ability to cite the exact chunk/paragraph where the resolution was documented.
3. **Structural Solution:** Splitting the incident into chunks in a dedicated one-to-many `incident_chunks` table gives each chunk its own sharp, topic-specific vector in vector space. Retrieval accurately matches the single most relevant chunk, and its `incident_id` foreign key seamlessly links back to the authoritative parent record.

3. Push and open a PR:
```bash
git push origin retrieval-schema-repair
```

4. Paste your `npm test` output (all 20 passing) into the PR description.

---

## What You May Not Do

- Change the retrieval spec (it is the source of truth)
- Add columns not in the spec
- Store the embedding as `TEXT`, `JSON`, or `float8[]` — it must be `vector(1536)`
- Skip `ON DELETE` on the FK — it must be explicit `ON DELETE CASCADE`
- Use `SERIAL`/`INTEGER` for the PK or FK
- Leave the `incidents.embedding` rejected column in place
- Skip either required index

---

## Project Structure

```
incident-retrieval-repair/
├── migrations/
│   └── 001_retrieval_schema.sql   ← the broken schema — only file you edit
├── tests/
│   └── schema.test.sql            ← 20 pgTAP tests — do not edit
├── README.md                      ← this file — update with your decisions
└── package.json                   ← npm scripts — do not edit
```
