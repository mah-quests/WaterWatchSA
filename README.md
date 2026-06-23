# WaterWatch SA

> Water visibility for every South African.

WaterWatch SA is a platform that gives communities, municipalities, and civil society
real-time visibility into water outages, restoration timelines, and water quality.
It is the SDLC Team Challenge project for the Derivco Graduate Programme 2026.

---

## Problem Statement

Communities experience water outages but have **no visibility of the causes or
restoration times**. WaterWatch SA solves this by providing a single platform that:

- **Reports outages** — citizens log outages with location, description, and photo.
- **Tracks water quality** — water quality readings are published per area.
- **Displays municipal updates** — official causes, ETAs, and announcements in one place.
- **Alerts citizens** — push / SMS / email notifications for outages and restorations.

---

## Stakeholders

| Stakeholder | Interest |
|---|---|
| Citizens / Community Members | Experience outages, need visibility |
| Municipal Water Authorities | Manage supply, issue updates |
| Local Government Officials | Accountable for service delivery |
| NGOs & Civil Society | Monitor water equity and quality |
| System Administrators | Manage platform operations |
| Media & Journalists | Report on outages and public impact |

---

## High-Level Architecture

A **3-tier architecture**: Frontend → API → Database.

### Frontend Layer
- **React** web app — outage map, reporting form, announcements feed.
- **React Native** mobile app — push alerts, offline reporting.
- Key screens: Home map, Report Outage, Quality Dashboard, Alerts.
- Integrates Google Maps API for geolocation; responsive for low-end Android devices.

### API Layer
- **Node.js / Express** REST API.
- Endpoints: `/outages`, `/quality`, `/alerts`, `/municipalities`.
- Business logic: outage status engine, alert dispatcher.
- Auth: **JWT** with role-based access (citizen vs municipal).
- Integrates SMS gateway (Clickatell) and push (Firebase FCM).

### Database Layer
- **PostgreSQL** — outages, users, municipalities, quality readings.
- **PostGIS** extension for geographic queries.
- **Redis** — caching alert queues and active outage states.
- Key tables: `Outages`, `QualityReadings`, `Alerts`, `Users`, `Updates`.

### Non-Functional Requirements
- **Performance:** map loads < 2s, alerts sent < 30s.
- **Availability:** 99.5% uptime, especially during outage events.
- **Security:** encrypted PII, POPIA-compliant data handling.
- **Scalability:** handles 50,000 concurrent users in crisis events.
- **Accessibility:** WCAG 2.1 AA, works on 3G connections.

---

## Product Backlog (Prioritised)

**P1 — Must**
- US-01: Citizen outage reporting (location, description, photo)
- US-02: Municipal outage update posting (cause + ETA)
- US-03: Push / SMS / email alert system for outages & restorations
- US-04: Live outage map with status indicators
- US-05: User registration & login (citizens and municipal)

**P2 — Should**
- US-06: Water quality index display per area
- US-07: Municipal news & announcement feed
- US-08: Outage history and resolution timeline view
- US-09: Search and filter outages by suburb or municipality
- US-10: Automated alert escalation if ETA is exceeded

**P3 — Could**
- US-11: Community upvoting of reported outages
- US-12: Analytics dashboard for municipal response times
- US-13: Integration with DWS national water quality API
- US-14: Multilingual support (Zulu, Xhosa, Afrikaans)
- US-15: Offline mode for low-connectivity areas

---

## Work to be Split

The build is divided into **7 workstreams**. Each is independently ownable, maps to
backlog items, and has a clear boundary against the others.

### Part 1 — Platform Foundation & Infrastructure
Repository scaffolding, monorepo/project structure, CI/CD, environment config, and the
**database layer**: PostgreSQL schema (`Outages`, `QualityReadings`, `Alerts`, `Users`,
`Updates`), PostGIS setup, Redis, and migrations. Hosting handled on internal
infrastructure (contact the AI Engineering team).
*Backlog: cross-cutting foundation for all stories.*

### Part 2 — Authentication & User Management
JWT auth, registration and login, role-based access control (citizen vs municipal vs
admin), and admin tooling for managing roles, permissions, and platform monitoring.
*Backlog: US-05, plus admin stories.*

### Part 3 — Outage Reporting & Live Map
Citizen outage reporting form (location, description, photo), the live outage map with
status indicators, and search/filter by suburb or municipality.
*Backlog: US-01, US-04, US-09.*

### Part 4 — Municipal Response & Updates
Municipal outage update posting (cause + ETA), the outage status engine, news &
announcement feed, and the outage history / resolution timeline view.
*Backlog: US-02, US-07, US-08.*

### Part 5 — Alerts & Notifications
Alert dispatcher and notification delivery via push (Firebase FCM), SMS (Clickatell),
and email, including automated escalation when an ETA is exceeded.
*Backlog: US-03, US-10.*

### Part 6 — Water Quality
Water quality readings ingestion and the quality index display per area / dashboard.
*Backlog: US-06.*

### Part 7 — Mobile App & Cross-Cutting Quality
React Native mobile app (push alerts, offline reporting), responsive low-end Android
support, and the non-functional requirements: performance, accessibility (WCAG 2.1 AA),
POPIA compliance, and scalability.
*Backlog: US-15 + NFRs.*

---

## Sprint Plan

Two-week sprints, delivering value each cycle.

| Sprint | Goal | Stories | Deliverable |
|---|---|---|---|
| 1 | Core reporting & authentication | US-01, US-05, US-04 | Citizens can register and report outages |
| 2 | Municipal response capability | US-02, US-03, US-08 | Municipalities respond; citizens get alerts |
| 3 | Quality data & discovery | US-06, US-07, US-09 | Citizens track quality and find local updates |
| 4 | Intelligence & escalation | US-10, US-11, US-12 | Platform self-manages escalations and insights |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Web frontend | React |
| Mobile | React Native |
| API | Node.js / Express |
| Auth | JWT (role-based) |
| Database | PostgreSQL + PostGIS |
| Cache / queues | Redis |
| Maps | Google Maps API |
| SMS | Clickatell |
| Push | Firebase FCM |
