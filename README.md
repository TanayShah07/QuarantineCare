# QuarantineCare

**A patient quarantine and treatment management prototype** built for
the FactWise Technical Product Manager campus assessment.

QuarantineCare helps a quarantine facility coordinate patient
registration, daily temperature monitoring, doctor rounds, discharge
decisions, room occupancy, and outcome reporting through one role-based
interface.

## Problem

The assessment describes a 74-room quarantine facility where manual
journal-based tracking can lead to duplicate or missed temperature
readings, doctor visits happening before a temperature is recorded,
missed doctor rounds, and delayed discharge notifications.

QuarantineCare prototypes a more structured workflow so staff can see
patient status, record daily readings, complete doctor reviews, and
track discharge recommendations.

## Core features

-   **Dashboard:** Overview of patient count, room occupancy,
    temperature alerts, pending doctor reviews, and discharge
    recommendations.
-   **Patient management:** Register patients and assign room details.
-   **Temperature tracking:** Record daily patient temperatures and
    prevent duplicate readings for the same patient on the same date.
-   **Doctor rounds:** Show patients requiring review and record doctor
    visit notes. A visit is gated until the current day's temperature
    has been recorded.
-   **Discharge workflow:** Track fever-free eligibility, allow a doctor
    to recommend discharge, and require administrator confirmation
    before discharge is completed.
-   **Room availability:** Completing a discharge releases the patient's
    room.
-   **Analytics:** Display completed patient outcomes,
    survival/mortality percentages, occupancy, and comparison with the
    assessment's 85% survival / 15% mortality benchmarks.
-   **Role-based interface:** Switch between Administrator, Nurse, and
    Doctor views to demonstrate role-specific workflows.
-   **Browser persistence:** Prototype data is saved in the browser
    using `localStorage`.

## Roles and responsibilities

  -----------------------------------------------------------------------
  Role                                Main actions
  ----------------------------------- -----------------------------------
  Administrator                       View facility overview, register
                                      patients, monitor operations,
                                      confirm discharge recommendations,
                                      and review analytics.

  Nurse                               Register patients and record daily
                                      temperature readings.

  Doctor                              Review patients after the day's
                                      temperature is recorded, add visit
                                      notes, and recommend discharge when
                                      criteria are met.
  -----------------------------------------------------------------------

> The role selector is a prototype/demo mechanism, not production
> authentication or server-enforced authorization.

## Discharge logic

The prototype uses the following workflow:

1.  A patient must have temperature readings below **37.5°C** for three
    full consecutive calendar days.
2.  The patient's temperature must also be recorded for the current day.
3.  A doctor must complete a visit for the current day and enter visit
    notes.
4.  The doctor can then recommend discharge.
5.  An administrator confirms the recommendation.
6.  Once discharged, the patient's room becomes available.

**Threshold note:** The assessment specifies prolonged fever but does
not provide a numeric fever threshold. The prototype uses 37.5°C as an
implementation assumption; it should be configurable and clinically
validated before any real-world use.

## Technology stack

-   React
-   Vite
-   JavaScript
-   Tailwind CSS
-   Lucide React icons
-   Recharts
-   Browser `localStorage` for prototype persistence

## Run locally

### Prerequisites

-   Node.js (LTS recommended)
-   npm

### Setup

``` bash
git clone https://github.com/TanayShah07/QuarantineCare.git
cd QuarantineCare
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal (typically
`http://localhost:5173`).

### Production build

``` bash
npm run build
npm run preview
```

The production build is generated in the `dist/` directory.

## Deployment

The project can be deployed to [Vercel](https://vercel.com/) by
importing the GitHub repository.

Recommended Vercel settings:

  Setting            Value
  ------------------ -----------------
  Framework preset   Vite
  Build command      `npm run build`
  Output directory   `dist`
  Install command    `npm install`

Every push to the connected GitHub branch can trigger a new deployment.

## Prototype limitations and assumptions

-   This is an assessment prototype, not a production clinical system.
-   Data is stored in the current browser's `localStorage`; it is not
    shared across devices or staff members and may be cleared by the
    browser.
-   The role switch demonstrates workflows but does not provide real
    login, identity verification, or secure permission enforcement.
-   There is no backend API, centralized database, real-time
    synchronization, or delivery of SMS/email/push notifications.
-   The temperature threshold of 37.5°C is an implementation assumption
    because the assessment does not specify a numeric threshold.
-   Sample records are demonstration data. Facility capacity is
    configured as 74 rooms; sample records do not represent 74 actual
    patients.
-   Outcome percentages are calculated from completed outcomes in the
    available prototype data. Small sample sizes can make these
    percentages unrepresentative.

## Assessment context

Created as a functional UI prototype for the **FactWise Junior Technical
Product Manager Campus Assessment**. The prototype focuses on making the
facility workflow visible, structured, and easier to monitor.

## Author

**Tanay Shah**\
GitHub: [@TanayShah07](https://github.com/TanayShah07)
