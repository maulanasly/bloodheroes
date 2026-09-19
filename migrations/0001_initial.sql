DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension unavailable: %', SQLERRM;
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS h3;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'h3-pg extension unavailable (app-side H3 will be used): %', SQLERRM;
END $$;

CREATE TABLE IF NOT EXISTS blood_types (
    name        TEXT PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_levels (
    level_id  SMALLINT PRIMARY KEY,
    name      TEXT NOT NULL,
    min_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    firstname     TEXT NOT NULL,
    lastname      TEXT,
    contact       TEXT,
    fcm_token     TEXT,
    photo_url     TEXT,
    gender        CHAR(1) NOT NULL DEFAULT 'U',
    blood_type    TEXT REFERENCES blood_types(name),
    level_id      SMALLINT NOT NULL DEFAULT 1 REFERENCES user_levels(level_id),
    status        SMALLINT NOT NULL DEFAULT 1,
    register_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    h3_cell       BIGINT,
    location      geography(Point, 4326),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_gender_check CHECK (gender IN ('M', 'F', 'U'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_h3_cell_idx ON users (h3_cell);
CREATE INDEX IF NOT EXISTS users_location_idx ON users USING GIST (location);
CREATE INDEX IF NOT EXISTS users_blood_type_idx ON users (blood_type);
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

CREATE TABLE IF NOT EXISTS app_tokens (
    token_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token      TEXT NOT NULL UNIQUE,
    name       TEXT,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    jti        TEXT PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS donation_requests (
    request_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blood_type       TEXT NOT NULL REFERENCES blood_types(name),
    notes            TEXT,
    requisite_number INTEGER NOT NULL DEFAULT 1 CHECK (requisite_number > 0),
    status           SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
    request_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    h3_cell          BIGINT,
    location         geography(Point, 4326)
);

CREATE INDEX IF NOT EXISTS donation_requests_user_idx ON donation_requests (user_id);
CREATE INDEX IF NOT EXISTS donation_requests_status_idx ON donation_requests (status);
CREATE INDEX IF NOT EXISTS donation_requests_blood_type_idx ON donation_requests (blood_type);
CREATE INDEX IF NOT EXISTS donation_requests_h3_cell_idx ON donation_requests (h3_cell);

CREATE TABLE IF NOT EXISTS donation_offers (
    offer_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES donation_requests(request_id) ON DELETE CASCADE,
    donor_id   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status     SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2, 3)),
    offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (request_id, donor_id)
);

CREATE INDEX IF NOT EXISTS donation_offers_donor_idx ON donation_offers (donor_id);
CREATE INDEX IF NOT EXISTS donation_offers_request_idx ON donation_offers (request_id);
CREATE INDEX IF NOT EXISTS donation_offers_status_idx ON donation_offers (status);
