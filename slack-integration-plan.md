# Plan: Slack integration

Date: 2026-10-19

## Goal

Give Forgeng a private Slack community, like Toptal does for its network. Only accepted people get in, and the app keeps Slack in step with the app:

1. **Accepted students join the Forgeng Slack**, and they are added to their cohort's channel.
2. **The app posts updates to Slack.** For example, a new task in the cohort channel, or a new application in the admins' channel.
3. **Students and mentors talk in Slack.** Mentors here are the admins. They answer questions in the cohort channel and in direct messages.

Toptal's internal setup is not public. "Like Toptal" here means the parts people can see: a private community that you join only after you pass screening, with channels for groups and topics.

## What the code has today

- **Notifications** are in-app and by email. They are sent from `NotificationsService`:
  - `notifyTaskPublished`
  - `notifySubmissionReceived`
  - `notifyApplicationReceived`
  - `notifyPaymentEligible`
  - `notifyFeedbackReceived`
- **Enrollments** change in three places:
  - when an application is accepted, in `ApplicationsService.updateStatus`
  - when an admin enrolls or removes a student, in `CohortsService.enroll` and `unenroll`
  - when a user is changed back to applicant, in `UsersService.updateRole`
- **`PlatformSetting`** is one settings row. Today it only holds the stipend amounts.
- **Background sends** already exist from issue #94: `MailService.sendInBackground` uses `waitUntil`, so a slow outside service never holds up a save.
- **There is no Slack code** and no Slack package yet.

## Important Slack limits

Check these in Slack's current documentation before you start, because Slack changes its plans:

- **The app cannot invite people to the workspace on normal plans.** The `admin.users.invite` method needs Enterprise Grid. On the Free and Pro plans, people join through an invite link or an email invite that an admin sends by hand.
- **The app can add people to channels.** Once someone is in the workspace, a bot can find them by email and add them to channels.
- **The Free plan shows only the last 90 days of messages**, and it allows only a few apps. A real community probably needs Pro.
- **Slack waits only 3 seconds for an answer** when it sends an event to the app. Longer work must run in the background.

The plan works around the first limit. The student joins with the invite link. Then Slack tells the app "a new person joined", and the app adds them to the right channels by itself.

---

## Phase 0: Workspace and invite link (about 1 day, almost no code)

### What the student sees

After their application is accepted, the student dashboard shows a **Join the Forgeng Slack** card with a button.

### Steps

1. Create the Forgeng Slack workspace and the first channels:
   - `#announcements`
   - `#general`
   - `#help`
   - `#mentors-only`, private, for admins
   - one channel for each cohort, for example `#cohort-autumn-2026`
2. Create an invite link in Slack.
3. Add a `slackInviteUrl` column to `PlatformSetting`, and a field for it on the admin settings page.
4. Show the card only to students. Applicants don't see it, so only accepted people can join.
5. Accept only links that start with `https://join.slack.com/`.

### How to check it

- Unit tests:
  - students see the card
  - applicants don't see it
  - a link that is not a Slack link is refused
- Run `pnpm --filter @forgeng/backend exec jest <path>` and `pnpm --filter @forgeng/frontend exec vitest run <path>`.

---

## Phase 1: Post app events to Slack (about 2 to 3 days)

### What people see

| Event in the app | Slack channel | Message |
|---|---|---|
| A task is published | the cohort's channel | "New task: Build a CLI, due 31 Oct", with an **Open task** button |
| A new application | `#mentors-only` | "New application from Ada Lovelace", with an **Review** button |
| A submission is sent for review | `#mentors-only` | "Ada submitted Build a CLI", with a **Review** button |
| A student finished all tasks for the month | `#mentors-only` | "Ada is eligible for the October stipend" |

The buttons are plain links to Forgeng. They need no extra Slack setup.

### How it works

1. **A Slack app for one workspace.** Create a Slack app in the Forgeng workspace and install it there. It is used by one workspace only, so it needs no Slack Marketplace review.
2. **Bot scopes for this phase:** `chat:write`, plus `channels:read` and `groups:read` to check channels.
3. **Settings in env vars:**
   - `SLACK_BOT_TOKEN`
   - `SLACK_MENTORS_CHANNEL_ID`
4. **The cohort channel.** Add a `slackChannelId` column to `Cohort`. An admin picks or pastes the channel on the cohort page. Later, the app could create the channel itself with `conversations.create`.
5. **A new module, `backend/src/modules/slack/`, with a `SlackService`.** It wraps the official `@slack/web-api` package, and has one method for each message.
6. **Messages are sent in the background with `waitUntil`, like emails.** A Slack error is logged and never fails a save.
   - Slack messages are not kept in the email outbox. If one is lost, the same information is still in the app and in the email.
7. **Calls are made from `NotificationsService`,** next to the in-app notice and the email. So each event is defined in one place.
8. **Without `SLACK_BOT_TOKEN`, nothing is posted.** Local development and tests then run without Slack.

### How to check it

- Unit tests with `@slack/web-api` mocked:
  - each event posts to the right channel, with the right text and link
  - a Slack error does not fail the save
  - nothing is posted without a token
- Run:
  - `pnpm --filter @forgeng/backend test`
  - `pnpm --filter @forgeng/backend test:e2e`
  - `pnpm --filter @forgeng/backend lint`
- By hand: publish a task on a preview deploy, and check the cohort channel.

---

## Phase 2: Keep channel members in step with the app (about 3 to 4 days)

### What people see

- A student joins the workspace with the invite link. A few seconds later, they are in their cohort's channel, and the bot sends them a welcome message.
- A student who moves to another cohort is moved to the new channel.
- A student who is removed from a cohort is removed from its channel. They stay in the workspace, for example in `#general` and `#alumni`.

### How it works

1. **Link each user to their Slack account.** Add `slackUserId` to `User`. The app finds it with `users.lookupByEmail`, using the student's Forgeng email.
   - If a student uses a different email in Slack, they can link their account on their profile page instead. This uses "Sign in with Slack", which is OpenID Connect.
2. **Listen for new members.** Turn on Slack's Events API for the `team_join` event. Slack calls `POST /api/slack/events`. The route:
   - checks Slack's signature with `SLACK_SIGNING_SECRET`. This needs the raw request body, so turn on `rawBody` in `main.ts` for this route.
   - answers within 3 seconds, and does the rest with `waitUntil`
   - finds the Forgeng user by email, saves `slackUserId`, adds them to their cohort channels, and sends a welcome message
   - ignores a Slack user with no matching Forgeng account
3. **Follow enrollment changes.** In the three places that change enrollments (listed above), call `SlackService.syncCohortChannels(userId)` in the background. It adds or removes the user with `conversations.invite` and `conversations.kick`.
4. **Extra bot scopes:**
   - `users:read` and `users:read.email`, to find users
   - `channels:manage` and `groups:write`, to add and remove members
   - `im:write`, for the welcome message
5. **A nightly check.** Add a second Vercel Cron call that compares all cohort channels with the enrollments, and fixes any difference. This catches a Slack call that failed.

### How to check it

- Unit tests with Slack mocked:
  - a correct signature is accepted
  - a wrong or old signature is refused
  - `team_join` adds the user to the right channels
  - a removed enrollment removes the user from the channel
  - an unknown Slack user is ignored
- An end-to-end test for `POST /api/slack/events`, with and without a valid signature.
- By hand: join the workspace with a test account, and check that it lands in the cohort channel.

### Security and privacy

- **Every event from Slack is checked** with the signing secret. Old requests are refused, so nobody can replay them.
- **The bot token is a secret.** Keep it only in env vars. It is never sent to the frontend.
- **Slack email lookups only match people who are already in the workspace.** The app never sends a student's email to Slack in a message.
- **Students who leave the program stay in the workspace** until an admin removes them by hand. On normal plans, the app cannot remove people from the workspace. Write this in the community rules.

---

## Phase 3 (later): Direct messages and actions in Slack

Build these only when Phases 1 and 2 work well.

- **Direct messages to students.** For example, "Your submission was approved", sent by the bot. Add a "Slack" option to the notification settings, next to "In-app" and "Email".
- **Actions from Slack.** For example, an **Approve** button in `#mentors-only`. This needs Slack's interactivity setup and the same signature check. It also needs a way to know which Forgeng admin pressed the button.
- **Sign in with Slack** as a fourth sign-in option.

---

## Slack and Google Calendar together

The Google Calendar plan is in `google-calendar-plan.md`. The two fit together: Google Calendar holds the times, and Slack is where people talk about them.

- **A scheduled meeting also goes to Slack.** When an admin schedules a meeting in Forgeng, the app sends the student a Slack direct message with the time and the Meet link. Slack's `chat.scheduleMessage` can send a reminder just before the meeting, with no extra cron job. This needs `slackUserId` from Phase 2 and the `chat:write` and `im:write` scopes.
- **Booking links are pinned in Slack.** Mentors pin their Google booking link in the cohort channel, so students find it where they already talk.
- **Due dates go to both.** The same task due dates fill the student calendar feed and a "due tomorrow" reminder in the cohort channel.
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

1. Phase 0: workspace and invite link. About 1 day.
2. Phase 1: post app events to Slack. About 2 to 3 days.
3. Phase 2: keep channel members in step. About 3 to 4 days.
4. Phase 3: only if needed.

## Open questions for you

1. **Slack plan.** Will the workspace be on Free, Pro, or Enterprise Grid? On Free, members only see the last 90 days of messages. Only Enterprise Grid lets the app invite people to the workspace.
2. **Who joins?** Only accepted students and admins, like Toptal? Or also applicants, for example in one `#applicants` channel?
3. **Cohort channels.** Should the app create a channel for each new cohort by itself, or should an admin create it and link it?
4. **After a cohort ends.** Should students stay in the cohort channel, or move to an `#alumni` channel?
5. **Which events go to Slack?** The table in Phase 1 is a suggestion. Add or remove events as you like.

## Branch

Start from the latest `main` on a new branch, for example `feat/slack-integration`.
