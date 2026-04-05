# Dinner Jump — Module 1: Website + Inschrijfflow

**Versie:** 1.0
**Datum:** 2026-04-05
**Status:** Design goedgekeurd, klaar voor implementatieplan

---

## Context

Dinner Jump is een digitaal platform dat fysieke roulerende diner-events faciliteert. Deelnemers ("duo's" — twee personen op één adres) bewegen tussen huizen voor een voorgerecht, hoofdgerecht en nagerecht, telkens met andere tafelgenoten.

Dit document beschrijft Module 1: de publieke website, het inschrijf- en betaalproces, het evenementen-systeem, en het uitnodigingsmechanisme. Dit is de eerste van meerdere modules die samen het volledige platform vormen.

### Latere modules (niet in scope)
- Module 2: Matching-algoritme (anti-repeat logica, geo-optimalisatie, kookopdracht-toewijzing)
- Module 3: Native app (avond-zelf ervaring, offline-sync, locatie-onthulling)
- Module 4: Organizer dashboard (uitgebreid beheer, welkomstkaart/PostGrid integratie)
- Module 5: Jump Foto, Jump Recap, afterparty-features

---

## Tech Stack

| Laag | Technologie |
|------|-------------|
| **Framework** | Next.js (App Router, server components) |
| **Database + Auth** | Supabase (Postgres, Auth, Row Level Security) |
| **Betalingen** | Stripe (Checkout, Webhooks, Refunds) |
| **E-mail** | Resend + React Email templates |
| **i18n** | next-intl (NL + EN handmatig, overige talen via DeepL API met database-cache) |
| **Hosting** | Vercel |
| **Domein** | Nog aan te schaffen (dinnerjump.nl / dinnerjump.com) |

---

## Database Schema

### `profiles`
Uitbreiding op Supabase Auth. Automatisch aangemaakt bij registratie.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID, PK, FK → auth.users | Supabase user ID |
| `display_name` | text | Weergavenaam |
| `email` | text | E-mailadres |
| `phone` | text, nullable | Telefoonnummer |
| `locale` | text, default 'nl' | Taalvoorkeur (nl/en/etc.) |
| `created_at` | timestamptz | Aanmaakdatum |
| `updated_at` | timestamptz | Laatste wijziging |

### `events`
Een Dinner Jump editie.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID, PK | |
| `organizer_id` | UUID, FK → profiles | Wie heeft het event aangemaakt |
| `title` | text | Eventnaam |
| `description` | text, nullable | Beschrijving |
| `slug` | text, unique | URL-vriendelijke identifier |
| `event_date` | date | Datum van het event |
| `start_time` | time | Starttijd |
| `travel_time_minutes` | int, check (15/30/45) | Reistijd tussen gangen |
| `center_lat` | double precision | Centrumpunt latitude |
| `center_lng` | double precision | Centrumpunt longitude |
| `center_address` | text | Adres van centrumpunt (weergave) |
| `radius_km` | int, default 5, check (1-10) | Maximale radius |
| `type` | enum: open/closed | Open = vindbaar, closed = invite-only |
| `status` | enum | draft/registration_open/confirmed/closed/active/completed/cancelled |
| `invite_code` | text, unique | Unieke code voor toegang |
| `invitation_policy` | enum: organizer_only/participants_allowed | Wie mag uitnodigen |
| `afterparty_address` | text, nullable | Afterparty-adres |
| `afterparty_lat` | double precision, nullable | |
| `afterparty_lng` | double precision, nullable | |
| `welcome_card_enabled` | boolean, default false | Welkomstkaart aan/uit |
| `registration_deadline` | timestamptz | Automatisch: event_date - 7 dagen |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `duos`
De basiseenheid: twee personen op één adres.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID, PK | |
| `event_id` | UUID, FK → events | |
| `person1_id` | UUID, FK → profiles | Inschrijver |
| `person2_id` | UUID, FK → profiles, nullable | Duo-partner (nullable tot bevestiging) |
| `address_line` | text | Straat + huisnummer |
| `city` | text | Stad |
| `postal_code` | text | Postcode |
| `country` | text, default 'NL' | Land |
| `lat` | double precision | Geocoded latitude |
| `lng` | double precision | Geocoded longitude |
| `status` | enum | pending_payment/registered/waitlisted/confirmed/cancelled |
| `payment_intent_id` | text, nullable | Stripe PaymentIntent ID (null voor organisator-duo) |
| `is_organizer_duo` | boolean, default false | Organisator-duo betaalt niet |
| `created_at` | timestamptz | |

### `invitations`
Persoonlijke uitnodigingen verstuurd door duo's.

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `id` | UUID, PK | |
| `event_id` | UUID, FK → events | |
| `invited_by_duo_id` | UUID, FK → duos | Welk duo heeft uitgenodigd |
| `invitee_name` | text | Naam van de genodigde |
| `invitee_email` | text | E-mail van de genodigde |
| `personal_message` | text, nullable | Optioneel persoonlijk berichtje |
| `status` | enum: sent/opened/registered | Tracking |
| `created_at` | timestamptz | |

**Constraints:**
- Max 5 invitations per duo per event (enforced via database constraint of applicatielogica)
- Organisator-duo heeft geen limiet op uitnodigingen
- Uitnodigingen alleen mogelijk als `event.invitation_policy = 'participants_allowed'` (of als het de organisator is)

---

## Wachtrij-logica

### Drempelmechanisme

De wachtrij werkt op basis van drempels van 3 duo's, met een minimum van 9 voor het eerste event.

**Fase 1: Minimum bereiken (0-9 duo's)**

| Duo # | Betaling | Status | Actie |
|--------|----------|--------|-------|
| 1-8 | €10 direct via Stripe | `registered` | Wacht op minimum |
| 9 | €10 direct via Stripe | Alle 9 → `confirmed` | Event bevestigd, bevestigingsmails |

Als duo 9 niet bereikt wordt vóór de deadline (T-7): alle duo's krijgen automatische Stripe Refund, event → `cancelled`.

**Fase 2: Groei per tafel (9+ duo's)**

| Duo # | Betaling | Status | Actie |
|--------|----------|--------|-------|
| 10 | €10 direct | `waitlisted` | Wachtlijstmail + uitnodigingsoptie |
| 11 | €10 direct | `waitlisted` | Update-mail naar duo 10 en 11: "nog 1 nodig" |
| 12 | €10 direct | 10, 11, 12 → `confirmed` | Bevestigingsmails |
| 13-14 | €10 direct | `waitlisted` | Wachtlijstmail + updates |
| 15 | €10 direct | 13, 14, 15 → `confirmed` | Bevestigingsmails |

Dit patroon herhaalt zich tot de deadline.

**Deadline (T-7 dagen):**
- Registratie sluit
- Waitlisted duo's met incomplete groep (1-2 duo's over) → automatische Stripe Refund
- Confirmed duo's: geen refund meer mogelijk (voorwaarden)

### Implementatie

Supabase database function die triggert bij elke duo-statuswijziging:

```
Na succesvolle betaling:
1. Tel bevestigde + registered + waitlisted duo's voor dit event
2. Als totaal < 9: status → registered
3. Als totaal = 9: alle registered → confirmed, stuur bevestigingsmails
4. Als totaal > 9:
   a. Bereken: (totaal - 9) % 3
   b. Als rest = 0: laatste 3 waitlisted → confirmed
   c. Anders: status → waitlisted, stuur wachtlijstmail
5. Bij elke nieuwe waitlisted duo: stuur update-mail naar alle waitlisted duo's van dezelfde "wachtgroep"
```

---

## Gebruikersflows

### Flow 1: Account aanmaken
1. Gebruiker registreert via e-mail + wachtwoord of magic link (Supabase Auth)
2. `profiles` record wordt automatisch aangemaakt via database trigger
3. `locale` wordt ingesteld op basis van browser-taal

### Flow 2: Event aanmaken (organisator)
1. Ingelogde gebruiker klikt "Organiseer een Dinner Jump"
2. Wizard met stappen:
   - Stap 1: Naam + beschrijving + type (open/gesloten)
   - Stap 2: Datum + starttijd + reistijd (15/30/45 min)
   - Stap 3: Centrumpunt instellen (adres → geocoding → kaart) + radius (slider 1-10 km)
   - Stap 4: Uitnodigingsbeleid (alleen ik / deelnemers mogen ook)
   - Stap 5: Optioneel: afterparty-adres + welkomstkaart aan/uit
   - Stap 6: Review + publiceer
3. Event krijgt unieke `invite_code` en `slug`
4. Organisator vult duo-gegevens in (adres + duo-partner) → automatisch `confirmed` zonder betaling
5. Organisator deelt link via WhatsApp/social/e-mail

### Flow 3: Inschrijven als duo (deelnemer)
1. Deelnemer bereikt eventpagina via invite-link (gesloten) of ontdekpagina (open)
2. Logt in of maakt account aan
3. Vult in: duo-partner (naam + e-mail) + adres
4. Geo-check: adres binnen radius? Nee → foutmelding. Ja → door naar betaling.
5. Stripe Checkout: €10 (iDEAL/creditcard/Bancontact)
6. Webhook verwerkt betaling → duo-status wordt bepaald (registered/waitlisted/confirmed)
7. Duo-partner ontvangt e-mail om account aan te maken
8. Relevante e-mails worden verstuurd (bevestiging/wachtlijst)

### Flow 4: Persoonlijke uitnodigingen
1. Duo gaat naar `/events/[slug]/my`
2. Sectie "Nodig iemand uit" (alleen zichtbaar als `invitation_policy = participants_allowed`)
3. Voert in: naam + e-mail + optioneel persoonlijk bericht (max 5)
4. Genodigde ontvangt mail: "[Naam] denkt dat Dinner Jump iets voor jou is" + persoonlijk bericht + event-info + inschrijflink met `ref=[duo_id]`

---

## Pagina-structuur & Routing

### Publiek (geen login)
| Route | Pagina |
|-------|--------|
| `/` | Landingspagina |
| `/events` | Ontdekpagina (open events + gesloten met "Op uitnodiging" label) |
| `/events/[slug]` | Eventpagina (details, thermometer, tijdklok, inschrijfknop) |
| `/join/[invite_code]` | Redirect naar eventpagina |
| `/about` | Over Dinner Jump |
| `/faq` | Veelgestelde vragen |
| `/terms` | Algemene voorwaarden |

### Authenticated (login vereist)
| Route | Pagina |
|-------|--------|
| `/dashboard` | Mijn events (als duo + als organisator) |
| `/events/create` | Event aanmaken wizard |
| `/events/[slug]/manage` | Organizer dashboard (thermometer, duo-lijst, instellingen) |
| `/events/[slug]/register` | Inschrijfflow (duo-gegevens + adres + betaling) |
| `/events/[slug]/my` | Deelnemer-view (status, uitnodigingen versturen, later: kookopdracht) |

### Technische keuzes
- Next.js App Router met server components voor SEO op publieke pagina's
- next-intl voor i18n (NL + EN handmatig, overige talen via DeepL API met cache)
- Supabase Auth middleware voor protected routes
- Stripe Checkout (hosted) voor betaling

---

## Stripe Betaalflow

### Flow
```
Deelnemer klikt "Inschrijven"
    → Vult duo-gegevens + adres in
    → Geo-check: adres binnen radius?
        → Nee: foutmelding
        → Ja: Supabase insert duo (status: pending_payment)
    → Next.js API route maakt Stripe Checkout Session (€10)
    → Redirect naar Stripe Checkout
    → Betaling geslaagd → Stripe webhook /api/webhooks/stripe
    → Webhook handler:
        1. Update duo status
        2. Sla payment_intent_id op
        3. Check drempel (zie wachtrij-logica)
        4. Stuur e-mails via Resend
```

### Stripe configuratie
- Product: "Dinner Jump Deelname"
- Price: €10,00 (vast)
- Betaalmethoden: iDEAL (primair), creditcard, Bancontact
- Webhook events: `checkout.session.completed`

### Refund-logica
- Event geannuleerd (minimum niet gehaald): automatische Stripe Refund voor alle duo's
- Waitlisted duo's op deadline zonder complete groep: automatische refund
- Confirmed duo annuleert na bevestiging: geen refund (voorwaarden)

### Organisator-duo
Doorloopt dezelfde flow maar slaat Stripe over. Duo wordt direct `confirmed` met `payment_intent_id = null` en `is_organizer_duo = true`.

---

## E-mail & Notificaties

### Transactionele e-mails (via Resend + React Email)

| Trigger | Ontvanger | Inhoud |
|---------|-----------|--------|
| Inschrijving voltooid | Duo (beide personen) | Bevestiging, eventnaam, datum, status |
| Duo-partner uitgenodigd | Person 2 | "Je bent uitgenodigd als duo-partner, maak je account aan" |
| Minimum bereikt (9 duo's) | Alle duo's | "Event gaat door! Je plek is bevestigd." |
| Nieuwe tafel vol (elke 3) | De 3 nieuwe duo's | "Jullie plek is bevestigd!" |
| Duo op wachtlijst geplaatst | Waitlisted duo | "Je staat op de wachtlijst. Nog X duo nodig. Nodig iemand uit via je dashboard." |
| Wachtlijst update (nieuw duo) | Alle waitlisted duo's in dezelfde groep | "Nog X duo nodig! Bijna zover." |
| Deadline, groep niet vol | Waitlisted duo's | "Helaas, je groep was niet compleet. €10 wordt teruggestort." |
| Persoonlijke uitnodiging | Genodigde | "[Naam] denkt dat Dinner Jump iets voor jou is" + persoonlijk bericht + inschrijflink |
| Kookopdracht (T-7) | Alle confirmed duo's | "Je host het [gang]. Veel kookplezier!" |
| Event herinnering (T-1) | Alle confirmed duo's | "Morgen is het zover!" |
| Organisator: nieuwe inschrijving | Organisator | "Nieuw duo ingeschreven! Nu X duo's." |
| Organisator: drempel bereikt | Organisator | "Event bevestigd!" of "Nieuwe tafel erbij!" |

### Taallogica
- NL + EN: handmatig onderhouden templates (gecontroleerde tone of voice)
- Overige talen: EN-template → DeepL API → database-cache
- Elke mail in de `locale` van de ontvanger
- Supabase Auth e-mails (wachtwoord reset etc.) via Supabase's eigen systeem

---

## Ontdekpagina — Event Discovery

### Open events
- Getoond met volledige info: naam, datum, stad, aantal duo's, inschrijfknop
- Filterbaar op locatie (stad/regio) en datum

### Gesloten events
- Getoond met "Op uitnodiging" label
- Zichtbaar: naam, datum, stad
- Geen inschrijfknop — alleen bereikbaar via invite-link
- Doel: FOMO creëren, zichtbaarheid van activiteit op het platform

---

## Internationalisatie (i18n)

### Aanpak
- next-intl als framework (route-based: `/nl/events`, `/en/events`)
- NL + EN als handmatig vertaalde basistalen
- Automatische vertaling voor alle andere talen via DeepL API
- Vertaalcache in Supabase database (voorkomt herhaalde API-calls)
- Browser-taaldetectie bij eerste bezoek → redirect naar juiste locale
- Taalswitcher in de header

### Wat wordt vertaald
- Alle UI-teksten (labels, knoppen, navigatie, foutmeldingen)
- E-mail templates
- Statische pagina's (about, FAQ, terms)
- Event-specifieke content (titel, beschrijving) wordt NIET vertaald — dat is user-generated content

---

## Beveiliging & Autorisatie

### Supabase Row Level Security (RLS)
- `profiles`: gebruiker kan alleen eigen profiel lezen/wijzigen
- `events`: publiek leesbaar (voor ontdekpagina), alleen organizer kan wijzigen
- `duos`: deelnemer kan alleen eigen duo lezen, organizer kan alle duo's van zijn event zien
- `invitations`: duo kan alleen eigen uitnodigingen beheren

### Stripe Webhook beveiliging
- Webhook signature verificatie via Stripe SDK
- Idempotency: dubbele webhook-calls worden genegeerd (check op payment_intent_id)

### Overig
- CSRF-bescherming via Next.js defaults
- Rate limiting op API routes (inschrijving, uitnodigingen)
- Geocoding via server-side API call (adres niet blootgesteld aan client)
