ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE duos ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- EVENTS
CREATE POLICY "Anyone can read published events" ON events FOR SELECT USING (status != 'draft');
CREATE POLICY "Organizers can read own drafts" ON events FOR SELECT USING (auth.uid() = organizer_id AND status = 'draft');
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- DUOS
CREATE POLICY "Participants can read own duo" ON duos FOR SELECT USING (auth.uid() = person1_id OR auth.uid() = person2_id);
CREATE POLICY "Organizers can read event duos" ON duos FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.id = duos.event_id AND events.organizer_id = auth.uid()));
CREATE POLICY "Users can register as duo" ON duos FOR INSERT WITH CHECK (auth.uid() = person1_id);
CREATE POLICY "Users can update own duo" ON duos FOR UPDATE USING (auth.uid() = person1_id);

-- INVITATIONS
CREATE POLICY "Duo members can read sent invitations" ON invitations FOR SELECT USING (EXISTS (SELECT 1 FROM duos WHERE duos.id = invitations.invited_by_duo_id AND (duos.person1_id = auth.uid() OR duos.person2_id = auth.uid())));
CREATE POLICY "Duo members can send invitations" ON invitations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM duos WHERE duos.id = invited_by_duo_id AND (duos.person1_id = auth.uid() OR duos.person2_id = auth.uid())));
