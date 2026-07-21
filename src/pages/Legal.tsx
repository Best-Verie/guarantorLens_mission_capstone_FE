import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo";

/**
 * Public Terms of Use (EULA) + Privacy Policy page.
 * Reachable at /legal without signing in, and linked from the sign-in screen and the
 * app sidebar. Each clause carries a short "why it matters" note so the ethical intent
 * is explicit (and easy to narrate during a demo).
 */

type Clause = { title: string; body: string; why?: string };

const TERMS: Clause[] = [
  {
    title: "1. What this is, and accepting these terms",
    body: "GuarantorLens is an academic capstone prototype that helps a savings and credit cooperative (SACCO) estimate and explain the default risk of a proposed loan. By signing in and using it, an authorised user accepts these Terms of Use.",
  },
  {
    title: "2. Decision support, not automated decisioning",
    body: "The tool produces a risk score, a band (Low / Medium / High) and an explanation. It never approves or rejects a loan on its own. A loan officer proposes and a credit manager decides; the software only informs that human decision.",
    why: "A person, not an algorithm, stays accountable for every lending decision, so applicants are never rejected by an opaque machine.",
  },
  {
    title: "3. How the score may be used",
    body: "The score is a probability estimate, not a guarantee or a verdict. It must not be the sole basis for granting or denying credit. It is one input alongside SACCO policy, documentation and the officer's judgement.",
    why: "It prevents over-reliance on a single number and the unfair denial of credit to a real person.",
  },
  {
    title: "4. Known limitations",
    body: "The model was trained on an anonymised sample of 11 branches of loans disbursed in 2022-2023. Its accuracy may not carry over to other periods, branches or products, and it can be wrong in individual cases.",
    why: "Being honest about scope invites ongoing human oversight instead of blind trust.",
  },
  {
    title: "5. Fair and lawful use",
    body: "Users must not use GuarantorLens to discriminate unlawfully against any person or group, and should watch for uneven outcomes across branches or groups. Guarantor-network signals are used to assess risk, not to penalise people for their associations alone.",
    why: "Credit risk tooling can quietly encode bias; this clause makes fair use an explicit obligation.",
  },
  {
    title: "6. User responsibilities",
    body: "Keep your credentials confidential, use the tool only for legitimate SACCO credit work, and do not attempt to re-identify any individual behind the anonymised data or to extract the underlying dataset.",
    why: "Most privacy failures start with misuse by an authorised user, not an outside attacker.",
  },
  {
    title: "7. Roles and access",
    body: "Access is role-based: loan officers assess and escalate, credit managers review and record recommendations, and admins manage the model and accounts. The server enforces these limits (for example, an officer cannot record a recommendation).",
  },
  {
    title: "8. No warranty and limited liability",
    body: "This prototype is provided \"as is\", without warranty. It is a student project for demonstration and research, not a certified production lending system, and the authors are not liable for decisions made using it.",
  },
  {
    title: "9. Changes to these terms",
    body: "These terms may be updated as the prototype evolves. Continued use after a change means you accept the updated terms.",
  },
];

const PRIVACY: Clause[] = [
  {
    title: "1. What data we process",
    body: "Anonymised member and loan records only: opaque client identifiers, savings and salary figures, branch, loan terms, and who guarantees whom. We do not hold names, national ID numbers, phone numbers or addresses.",
    why: "Collecting the minimum, de-identified data limits the harm if anything is ever exposed.",
  },
  {
    title: "2. Why we process it (purpose limitation)",
    body: "The data is used only to assess a loan's default risk, explain that risk, and show the guarantor network behind it. It is not sold, and it is not used for advertising or any unrelated purpose.",
    why: "Data given for credit assessment stays used for credit assessment, nothing else.",
  },
  {
    title: "3. Lawful basis",
    body: "The tool is operated under the SACCO's own authority for internal credit-risk management, on data that has already been de-identified before it reaches the system.",
  },
  {
    title: "4. Who can see the data",
    body: "Only authenticated SACCO staff, and only what their role allows. Assessments are linked to the officer who ran them, so activity is attributable.",
    why: "Least-privilege access keeps members' financial details away from anyone who does not need them.",
  },
  {
    title: "5. How it is protected",
    body: "Passwords are hashed, sessions use signed tokens (JWT), traffic runs over HTTPS, secrets are read from the environment rather than stored in code, and member identifiers are shown as opaque salted references in the interface and URLs.",
    why: "Confidential financial data needs defence in depth, not a single lock.",
  },
  {
    title: "6. Re-identification is prohibited",
    body: "No user may try to link the anonymised records back to a named individual, whether by combining fields, cross-referencing outside data, or any other means.",
    why: "Anonymisation only protects people if everyone agrees not to undo it.",
  },
  {
    title: "7. Retention",
    body: "Reference member and loan data is kept for as long as the tool operates; assessment and application records are retained according to the SACCO's own record-keeping policy.",
  },
  {
    title: "8. Members' rights",
    body: "Although the system holds no direct identifiers, the SACCO remains responsible for members' rights (such as access, correction and objection) and handles those requests through its normal channels.",
    why: "De-identification does not cancel the duty of care owed to the people behind the data.",
  },
  {
    title: "9. Third parties",
    body: "Data is not shared with outside parties except the infrastructure providers that host the application, which process it only to keep the service running.",
  },
];

function Section({ id, kicker, title, clauses }: { id: string; kicker: string; title: string; clauses: Clause[] }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{kicker}</p>
      <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-5 space-y-4">
        {clauses.map((c) => (
          <div key={c.title} className="rounded-xl border border-line bg-white p-5">
            <h3 className="text-[15px] font-semibold text-ink">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{c.body}</p>
            {c.why && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm leading-relaxed text-brand">
                <span className="font-semibold">Why it matters: </span>
                {c.why}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Legal() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-8">
        <Logo theme="light" showSub={false} />
        <Link to="/login" className="text-sm font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Legal</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Terms of Use &amp; Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate">
          GuarantorLens is a BSc Software Engineering capstone prototype (African Leadership University),
          built as decision support for Umwalimu SACCO, Rwanda. It is a demonstration system, not a
          certified production lending platform.
        </p>

        {/* in-page nav */}
        <nav className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#terms" className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium text-ink hover:bg-slate-100">
            Terms of Use
          </a>
          <a href="#privacy" className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium text-ink hover:bg-slate-100">
            Privacy Policy
          </a>
        </nav>

        <div className="mt-10 space-y-12">
          <Section id="terms" kicker="End-user licence / terms" title="Terms of Use" clauses={TERMS} />
          <Section id="privacy" kicker="How we handle data" title="Privacy Policy" clauses={PRIVACY} />
        </div>

        <p className="mt-12 border-t border-line pt-6 text-xs text-slate">
          Questions about these terms or the data used here can be directed to the SACCO's credit office
          or the project author. This prototype's data is anonymised and used for academic demonstration.
        </p>
      </main>
    </div>
  );
}
