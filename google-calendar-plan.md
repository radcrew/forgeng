# Plan: Google Calendar integration

Date: 2026-10-19

## Goal

1. **Admins schedule meetings with students and applicants.** In Forgeng, an admin is a mentor or a teacher. Examples: an interview with an applicant, or a one-to-one mentoring call with a student. The meeting goes into the admin's Google Calendar, and the student gets an invite with a Google Meet link.
2. **Students see their deadlines in their calendar.** This covers task due dates and cohort dates.

Part 1 is the main goal. Part 2 is smaller and can come later.

## What the code has today

- **Google sign-in** asks only for the `email` and `profile` scopes. The app keeps no Google access token, so it cannot write to anyone's calendar today.
- **Applications** have three statuses: `pending`, `accepted`, and `rejected`. There is no interview step yet.
- **Tasks** have a `dueDate`. **Cohorts** have a `startDate` and an `endDate`.
- **Admins and students** may sign in with Google, GitHub, or a password.

---

## Part 1: Admins schedule meetings

### Two ways to do it

| | A. Google booking page link | B. Schedule from Forgeng with the Calendar API |
|---|---|---|
| How it works | Each admin makes an "appointment schedule" in Google Calendar. Forgeng shows a "Book a meeting" button with that link. The student picks a free time on Google's page. | The admin picks a student, a date, and a time in Forgeng. The backend creates the event in the admin's Google Calendar and invites the student. |
| Who picks the time | The student, from the admin's free times | The admin |
| Google Meet link | ✅ Yes, Google adds it | ✅ Yes, the backend asks Google for it |
| Forgeng knows about the meeting | ❌ No. The booking stays in Google. | ✅ Yes. Forgeng saves it and can show it on the student's dashboard and the application page. |
| Admin connects Google in Forgeng | ❌ No | ✅ Yes, once |
| Google app review | ❌ No | Maybe. See "Google app review" below. |
| Size of the work | Small: about 1 day | Large: about 1 to 1.5 weeks |

### Recommendation

Start with **A** if you want something this week. It needs almost no code, and students can pick a time that suits them.

Build **B** when you want meetings to be part of Forgeng itself. For example, an "Interview" step on the application page, or a list of upcoming meetings on the student dashboard.

You can also do both. A is for open office hours, and B is for interviews that the admin plans.

---

### Option A: Google booking page link

#### Steps

1. Each admin creates an appointment schedule in Google Calendar. Google gives a booking page link.
2. Add a `bookingUrl` column to `User`, for admins only. The admin pastes the link in their settings.
3. Show a **Book a meeting with your mentor** button:
   - on the student dashboard
   - on the application status page, for an applicant who is invited to an interview
4. Accept only links that start with `https://calendar.google.com/` or `https://calendar.app.google/`, so nobody can add a harmful link.

#### How to check it

- A unit test for the link check.
- By hand: book a time through the button, and check that it shows up in the admin's calendar.

---

### Option B: Schedule from Forgeng with the Calendar API

#### What the admin sees

1. On their settings page: **Connect Google Calendar**. Google asks for permission once.
2. On an application page or a student's page: **Schedule a meeting**. The form asks for:
   - the title, for example "Interview" or "Mentoring call"
   - the date, the start time, and the length
   - an optional note
3. After saving, the meeting shows with its Google Meet link. The admin can **Reschedule** or **Cancel** it.

#### What the student sees

- Google sends an email invite with the Meet link. It works with any email address, not only Gmail.
- In Forgeng, an **Upcoming meetings** card on the dashboard, and an in-app notice.
- The student does not need to connect Google.

#### How it works

1. **Connecting Google.** This is a separate step from sign-in.
   - The admin opens `GET /api/integrations/google-calendar/connect`. The backend sends them to Google with:
     - the scope `https://www.googleapis.com/auth/calendar.events`
     - `access_type=offline`, so Google gives a refresh token
     - a signed `state` value that protects against forged requests
   - Google sends the admin back to `/api/integrations/google-calendar/callback`. The backend swaps the code for tokens and saves the refresh token, encrypted.
2. **Creating a meeting.** The backend calls the Google Calendar API to create an event in the admin's main calendar:
   - The student's email is added as a guest.
   - `sendUpdates=all`, so Google emails the invite.
   - `conferenceDataVersion=1` with a `createRequest`, so Google adds a Meet link.
   - Forgeng saves the meeting with the Google event ID and the Meet link.
3. **Rescheduling or cancelling** changes or deletes the same Google event, again with `sendUpdates=all`. Google emails the student about the change.
4. **The admin waits for Google here.** The admin needs the Meet link right away, and must know if it failed. So unlike the emails in issue #94, this call is not sent in the background.
5. **A revoked connection.** If the admin removes Forgeng's access in their Google account, Google refuses the call. Forgeng then marks the connection as broken and asks the admin to connect again.

#### Database

```prisma
// One Google Calendar connection for each admin.
model GoogleCalendarConnection {
  userId                Int      @id @map("user_id")
  googleEmail           String   @map("google_email")
  refreshTokenEncrypted String   @map("refresh_token_encrypted")
  connectedAt           DateTime @default(now()) @map("connected_at") @db.Timestamptz
  brokenAt              DateTime? @map("broken_at") @db.Timestamptz
}

enum MeetingStatus {
  scheduled
  cancelled
}

model Meeting {
  id            Int           @id @default(autoincrement())
  hostId        Int           @map("host_id")       // the admin
  attendeeId    Int           @map("attendee_id")   // the student or applicant
  applicationId Int?          @map("application_id")
  title         String
  note          String?
  startsAt      DateTime      @map("starts_at") @db.Timestamptz
  endsAt        DateTime      @map("ends_at") @db.Timestamptz
  googleEventId String?       @map("google_event_id")
  meetUrl       String?       @map("meet_url")
  status        MeetingStatus @default(scheduled)
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz
}
```

Relations and indexes are left out here to keep it short.

#### Security

- **Refresh tokens are encrypted** with AES-256-GCM. The key is in a new env var, `GOOGLE_TOKEN_KEY`. Today `common/crypto` only has `hashToken`. A refresh token must be read back, so a hash is not enough.
- **Only admins** can connect Google and schedule meetings. Use `@Roles('admin')`.
- **A student can see only their own meetings.**
- **Disconnect** revokes the token at Google and deletes the row.

#### Google app review

The `calendar.events` scope is "sensitive", so Google may need to review the app. Which path applies depends on your Google account:

- **Google Workspace, with admins on your company domain:** set the app as "Internal". Then there is no review.
- **Personal Gmail accounts:**
  - An app in "Testing" mode works only for listed test users. Its refresh tokens stop working after 7 days, so admins would need to connect again every week.
  - An app that is "In production" but not reviewed shows an "unverified app" warning, and it is limited to 100 users. That may be fine for a few admins.
  - A full review removes the warning. It needs a privacy policy page and a demo video, and it can take weeks.

These rules change sometimes. Check Google's current documentation before you choose.

#### Steps

1. **Google Cloud.** Enable the Google Calendar API. Add the scope and the new callback URL to the existing OAuth client, or create a new client.
2. **Database.** Add the two models and create the migration. Use `pnpm prisma:migrate` against a local or development database, not the cloud database in `backend/.env`.
3. **Encryption helper.** Add `encrypt` and `decrypt` to `common/crypto`, with tests.
4. **Backend module.** Add `backend/src/modules/meetings/` with:
   - `GoogleCalendarService`: connect, disconnect, and create, update, or delete an event. Use the official `googleapis` package, or `google-auth-library` with plain requests.
   - `MeetingsService` and `MeetingsController`: schedule, reschedule, cancel, and list meetings for an admin or a student.
5. **Notices.** Send an in-app notice to the student when a meeting is scheduled, moved, or cancelled. Google already sends the email.
6. **Frontend for admins:**
   - a Connect Google Calendar card in admin settings
   - a Schedule a meeting dialog on the application page and on the student page
   - a list of meetings, with reschedule and cancel
7. **Frontend for students:** an Upcoming meetings card on the dashboard.
8. Read `frontend/AGENTS.md` and the Next.js 16 docs in `node_modules/next/dist/docs/` before you change the frontend.

#### How to check it

- Unit tests with the Google API mocked:
  - a meeting is created with the student as a guest, `sendUpdates=all`, and a Meet request
  - a reschedule updates the same event
  - a refused token marks the connection as broken
  - a student cannot see another student's meeting
  - a non-admin cannot schedule a meeting
- An end-to-end test for the meetings routes.
- Run:
  - `pnpm --filter @forgeng/backend exec jest <path>`
  - `pnpm --filter @forgeng/backend test:e2e`
  - `pnpm --filter @forgeng/backend lint`
  - `pnpm --filter @forgeng/frontend lint`
- By hand, on a preview deploy: connect Google, schedule a meeting with a test student, then check the invite email and the Meet link.

---

## Part 2: Student deadlines in their calendar

This is smaller, and it does not need a Google login.

1. **"Add to Google Calendar" button on a task.** The frontend builds a Google Calendar link with the task title and due date. It needs no backend change, and takes about half a day. The saved event does not update when the due date changes.
2. **A private calendar link for each student.** A public route, `GET /api/calendar/:token.ics`, returns all the student's task due dates and cohort dates as an iCalendar file. The student subscribes to it once in Google Calendar, Outlook, or Apple Calendar.
   - It needs a `calendarToken` column on `User`.
   - The calendar updates by itself, but Google refreshes it on its own schedule. A changed due date can take several hours to show up.
   - It takes about 2 to 3 days.
   - Scheduled meetings from Part 1 are already in the student's calendar through the Google invite, so the feed does not need them.

---

## Slack and Google Calendar together

The Slack plan is in `slack-integration-plan.md`. The two fit together: Google Calendar holds the times, and Slack is where people talk about them.

- **A scheduled meeting also goes to Slack.** When an admin schedules a meeting (option B), the app sends the student a Slack direct message with the time and the Meet link. Slack's `chat.scheduleMessage` can send a reminder just before the meeting, with no extra cron job.
- **Booking links are pinned in Slack.** With option A, mentors pin their Google booking link in the cohort channel, so students find it where they already talk.
- **Due dates go to both.** The same task due dates fill the student calendar feed (Part 2) and a "due tomorrow" reminder in the cohort channel.
- **Slack's own Google Calendar app needs no code.** Each person can add it in Slack. It shows event reminders and can set their status to "In a meeting".
- **One shared base in the code.** Both are sent in the background with `waitUntil`, like emails. Both find a user by email. One "Integrations" settings page can hold the Google Calendar connection for admins, and the Slack link and calendar feed for students.

If you build both, this order lets each step use the one before:

1. Slack phase 0: workspace and invite link.
2. Calendar option A: booking page links, pinned in Slack.
3. Slack phase 1: app events posted to Slack.
4. Slack phase 2: link Slack accounts and keep channel members in step. The meeting message in step 5 needs the Slack account link.
5. Calendar option B: scheduling from Forgeng, with the Slack message and reminder.
6. The student calendar feed.

## Suggested order

1. Part 1, option A: booking page links. About 1 day.
2. Part 2, step 1: the "Add to Google Calendar" button on a task. About half a day.
3. Part 1, option B: scheduling from Forgeng. About 1 to 1.5 weeks.
4. Part 2, step 2: the private calendar link. About 2 to 3 days.

## Open questions for you

1. **Who has meetings?** Applicants (interviews before acceptance), students (mentoring), or both?
2. **Who picks the time?** The admin (option B), the student from the admin's free times (option A), or both?
3. **Google account type.** Are the admin accounts on Google Workspace with your own domain, or personal Gmail? This decides the Google review path.
4. **Interview step.** For applicants, do you want a new "interview" status between `pending` and the decision?
5. **Free and busy times.** Should Forgeng warn the admin about a clash in their calendar? That needs one more scope.

## Branch

Start from the latest `main` on a new branch, for example `feat/google-calendar`.
