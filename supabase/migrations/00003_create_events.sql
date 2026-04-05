CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  travel_time_minutes INT NOT NULL CHECK (travel_time_minutes IN (15, 30, 45)),
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  center_address TEXT NOT NULL,
  radius_km INT NOT NULL DEFAULT 5 CHECK (radius_km >= 1 AND radius_km <= 10),
  type event_type NOT NULL DEFAULT 'closed',
  status event_status NOT NULL DEFAULT 'draft',
  invite_code TEXT NOT NULL UNIQUE,
  invitation_policy invitation_policy NOT NULL DEFAULT 'organizer_only',
  afterparty_address TEXT,
  afterparty_lat DOUBLE PRECISION,
  afterparty_lng DOUBLE PRECISION,
  welcome_card_enabled BOOLEAN NOT NULL DEFAULT false,
  registration_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_invite_code ON events(invite_code);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type_status ON events(type, status);
CREATE INDEX idx_events_organizer ON events(organizer_id);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
