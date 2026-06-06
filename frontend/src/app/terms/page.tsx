import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Forgeng",
  description:
    "The terms that govern your use of Forgeng's apprenticeship platform.",
};

const TermsPage = () => (
  <LegalPage
    title="Terms of Service"
    lastUpdated="June 6, 2026"
    intro="These Terms of Service govern your access to and use of Forgeng's website, applications, and apprenticeship programs. By creating an account or applying to a cohort, you agree to these terms."
  >
    <LegalSection heading="1. Eligibility">
      <p>
        You must be at least 16 years old to create an account and apply to a
        cohort. By using Forgeng you represent that the information you provide
        during sign-up and application is accurate and that you are legally
        permitted to enter into these terms.
      </p>
    </LegalSection>

    <LegalSection heading="2. Your account">
      <p>
        You are responsible for safeguarding your account credentials and for
        all activity that occurs under your account. Notify us immediately of
        any unauthorized use. We may suspend or terminate accounts that violate
        these terms or that we reasonably believe pose a risk to other members.
      </p>
    </LegalSection>

    <LegalSection heading="3. The apprenticeship program">
      <p>
        Forgeng provides a mentor-led apprenticeship in which participants
        complete real projects and receive feedback. Admission to a cohort is
        selective and is not guaranteed by submitting an application. Program
        structure, tasks, schedules, and mentors may change at our discretion.
      </p>
    </LegalSection>

    <LegalSection heading="4. Your submissions">
      <p>
        You retain ownership of the work you submit. By submitting work through
        the platform you grant Forgeng a non-exclusive license to review, store,
        and display that work for the purposes of running the program and
        providing feedback. Do not submit content that infringes the rights of
        others or that you do not have permission to share.
      </p>
    </LegalSection>

    <LegalSection heading="5. Acceptable use">
      <p>You agree not to:</p>
      <ul>
        <li>Misrepresent your identity, experience, or the authorship of your work.</li>
        <li>Harass, abuse, or harm other participants, mentors, or staff.</li>
        <li>Attempt to disrupt, reverse engineer, or gain unauthorized access to the platform.</li>
        <li>Use the platform for any unlawful purpose.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="6. Payments">
      <p>
        Where a cohort or service carries a fee, the applicable amount, billing
        cycle, and refund terms are presented to you before you complete
        payment. Fees are payable through our third-party payment processor, and
        your use of that service is subject to its own terms.
      </p>
    </LegalSection>

    <LegalSection heading="7. Intellectual property">
      <p>
        The Forgeng name, logo, platform, and program materials are owned by
        Forgeng and protected by intellectual property laws. These terms do not
        grant you any right to use our branding or materials except as needed to
        participate in the program.
      </p>
    </LegalSection>

    <LegalSection heading="8. Disclaimers">
      <p>
        The platform is provided &ldquo;as is&rdquo; without warranties of any
        kind. We do not guarantee employment, certification, or any particular
        outcome from participating in the program.
      </p>
    </LegalSection>

    <LegalSection heading="9. Limitation of liability">
      <p>
        To the maximum extent permitted by law, Forgeng will not be liable for
        any indirect, incidental, or consequential damages arising from your use
        of the platform or participation in the program.
      </p>
    </LegalSection>

    <LegalSection heading="10. Changes to these terms">
      <p>
        We may update these terms from time to time. When we make material
        changes we will update the date above and, where appropriate, notify
        you. Your continued use of the platform after changes take effect
        constitutes acceptance of the revised terms.
      </p>
    </LegalSection>

    <LegalSection heading="11. Contact">
      <p>
        Questions about these terms? Reach us at{" "}
        <a href="mailto:hello@forgeng.com">hello@forgeng.com</a>.
      </p>
    </LegalSection>
  </LegalPage>
);

export default TermsPage;
