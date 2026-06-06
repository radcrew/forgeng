import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Forgeng",
  description:
    "How Forgeng collects, uses, and protects your personal information.",
};

const PrivacyPage = () => (
  <LegalPage
    title="Privacy Policy"
    lastUpdated="June 6, 2026"
    intro="This Privacy Policy explains what information Forgeng collects, how we use it, and the choices you have. It applies to our website, applications, and apprenticeship programs."
  >
    <LegalSection heading="1. Information we collect">
      <p>We collect information you provide and information generated through your use of the platform:</p>
      <ul>
        <li>
          <strong>Account information</strong> — your name, email address, and
          password when you sign up.
        </li>
        <li>
          <strong>Application information</strong> — the details, answers, and
          materials you submit when applying to a cohort.
        </li>
        <li>
          <strong>Program activity</strong> — tasks, submissions, feedback, and
          progress recorded as you participate.
        </li>
        <li>
          <strong>Technical data</strong> — basic log and device information
          needed to operate and secure the platform.
        </li>
      </ul>
    </LegalSection>

    <LegalSection heading="2. How we use your information">
      <p>We use your information to:</p>
      <ul>
        <li>Operate the platform and run the apprenticeship program.</li>
        <li>Review applications and admit participants to cohorts.</li>
        <li>Provide mentorship, feedback, and notifications about your progress.</li>
        <li>Communicate with you about your account, application, and program updates.</li>
        <li>Maintain the security and integrity of the platform.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="3. How we share information">
      <p>
        We do not sell your personal information. We share it only with mentors
        and staff who need it to run the program, and with service providers —
        such as our hosting, email, and payment processors — who process data on
        our behalf under appropriate confidentiality obligations. We may also
        disclose information when required by law.
      </p>
    </LegalSection>

    <LegalSection heading="4. Data retention">
      <p>
        We keep your information for as long as your account is active and as
        needed to provide the program. We may retain certain records for longer
        where required to comply with legal obligations or resolve disputes.
      </p>
    </LegalSection>

    <LegalSection heading="5. Your rights">
      <p>
        Depending on where you live, you may have the right to access, correct,
        export, or delete your personal information, and to object to or restrict
        certain processing. To exercise these rights, contact us using the
        details below.
      </p>
    </LegalSection>

    <LegalSection heading="6. Security">
      <p>
        We use reasonable technical and organizational measures to protect your
        information. No method of transmission or storage is completely secure,
        so we cannot guarantee absolute security, but we work to safeguard your
        data and to respond promptly to any incident.
      </p>
    </LegalSection>

    <LegalSection heading="7. Children's privacy">
      <p>
        Forgeng is not intended for children under 16. We do not knowingly
        collect personal information from children under that age. If you
        believe a child has provided us information, contact us and we will
        delete it.
      </p>
    </LegalSection>

    <LegalSection heading="8. Changes to this policy">
      <p>
        We may update this Privacy Policy from time to time. When we make
        material changes we will update the date above and, where appropriate,
        notify you.
      </p>
    </LegalSection>

    <LegalSection heading="9. Contact">
      <p>
        Questions about your privacy? Reach us at{" "}
        <a href="mailto:hello@forgeng.com">hello@forgeng.com</a>.
      </p>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPage;
