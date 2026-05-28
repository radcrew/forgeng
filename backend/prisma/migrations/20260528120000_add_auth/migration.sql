-- Auth schema additions: password/verified flags on users, plus
-- AuthIdentity (OAuth), VerificationToken (email verify, password reset),
-- and RefreshToken (rotation + revocation tracking).

CREATE TYPE "AuthProvider" AS ENUM ('google', 'github');
CREATE TYPE "VerificationTokenType" AS ENUM ('email_verify', 'password_reset');

ALTER TABLE "users"
  ADD COLUMN "password_hash"  TEXT,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "avatar_url"     TEXT;

CREATE TABLE "auth_identities" (
  "id"                  SERIAL PRIMARY KEY,
  "user_id"             INTEGER NOT NULL,
  "provider"            "AuthProvider" NOT NULL,
  "provider_account_id" TEXT NOT NULL,
  "email"               TEXT,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_identities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "auth_identities_provider_provider_account_id_key"
  ON "auth_identities"("provider", "provider_account_id");
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");

CREATE TABLE "verification_tokens" (
  "id"         SERIAL PRIMARY KEY,
  "user_id"    INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "type"       "VerificationTokenType" NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at"    TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "verification_tokens_token_hash_key"
  ON "verification_tokens"("token_hash");
CREATE INDEX "verification_tokens_user_id_type_idx"
  ON "verification_tokens"("user_id", "type");

CREATE TABLE "refresh_tokens" (
  "id"                SERIAL PRIMARY KEY,
  "user_id"           INTEGER NOT NULL,
  "token_hash"        TEXT NOT NULL,
  "expires_at"        TIMESTAMPTZ NOT NULL,
  "revoked_at"        TIMESTAMPTZ,
  "replaced_by_hash"  TEXT,
  "user_agent"        TEXT,
  "ip"                TEXT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key"
  ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
