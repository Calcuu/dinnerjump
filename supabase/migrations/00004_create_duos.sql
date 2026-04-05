CREATE TABLE duos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person1_id UUID NOT NULL REFERENCES profiles(id),
  person2_id UUID REFERENCES profiles(id),
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'NL',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status duo_status NOT NULL DEFAULT 'pending_payment',
  payment_intent_id TEXT,
  is_organizer_duo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, person1_id)
);

CREATE INDEX idx_duos_event ON duos(event_id);
CREATE INDEX idx_duos_event_status ON duos(event_id, status);
CREATE INDEX idx_duos_person1 ON duos(person1_id);
