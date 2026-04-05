CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invited_by_duo_id UUID NOT NULL REFERENCES duos(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  personal_message TEXT,
  ref_code TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_event ON invitations(event_id);
CREATE INDEX idx_invitations_duo ON invitations(invited_by_duo_id);
CREATE INDEX idx_invitations_ref ON invitations(ref_code);

CREATE OR REPLACE FUNCTION check_invitation_limit()
RETURNS TRIGGER AS $$
DECLARE
  duo_is_organizer BOOLEAN;
  invitation_count INT;
BEGIN
  SELECT is_organizer_duo INTO duo_is_organizer FROM duos WHERE id = NEW.invited_by_duo_id;
  IF duo_is_organizer THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO invitation_count FROM invitations WHERE invited_by_duo_id = NEW.invited_by_duo_id AND event_id = NEW.event_id;
  IF invitation_count >= 5 THEN RAISE EXCEPTION 'Maximum 5 invitations per duo'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_invitation_limit
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION check_invitation_limit();
