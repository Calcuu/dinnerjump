CREATE TYPE event_type AS ENUM ('open', 'closed');
CREATE TYPE event_status AS ENUM ('draft', 'registration_open', 'confirmed', 'closed', 'active', 'completed', 'cancelled');
CREATE TYPE duo_status AS ENUM ('pending_payment', 'registered', 'waitlisted', 'confirmed', 'cancelled');
CREATE TYPE invitation_policy AS ENUM ('organizer_only', 'participants_allowed');
CREATE TYPE invitation_status AS ENUM ('sent', 'opened', 'registered');
