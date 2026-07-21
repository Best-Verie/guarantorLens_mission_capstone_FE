# GuarantorLens - Terms of Use & Privacy Policy

Documented copy of the in-app legal page (route `/legal`, also linked from the sign-in screen and the app sidebar). GuarantorLens is a BSc Software Engineering capstone prototype (African Leadership University), built as decision support for Umwalimu SACCO, Rwanda. It is a demonstration system, not a certified production lending platform.

Each clause carries a short "why it matters" note so the ethical intent is explicit.

## Terms of Use (end-user licence)

1. **What this is, and accepting these terms.** GuarantorLens helps a SACCO estimate and explain the default risk of a proposed loan. Signing in and using it means an authorised user accepts these terms.
2. **Decision support, not automated decisioning.** The tool produces a score, a band (Low/Medium/High) and an explanation; it never approves or rejects a loan on its own. An officer proposes, a credit manager decides. *Why: a person, not an algorithm, stays accountable for every lending decision.*
3. **How the score may be used.** The score is a probability estimate, not a guarantee, and must not be the sole basis for granting or denying credit. *Why: prevents over-reliance and unfair denial.*
4. **Known limitations.** Trained on an anonymised sample of 11 branches, 2022-2023; accuracy may not generalise and can be wrong in individual cases. *Why: honesty about scope invites human oversight.*
5. **Fair and lawful use.** Must not be used to discriminate unlawfully; watch for uneven outcomes across branches/groups. *Why: risk tooling can encode bias.*
6. **User responsibilities.** Keep credentials secret, use only for legitimate SACCO work, do not attempt to re-identify individuals or extract the dataset. *Why: most privacy failures start with authorised misuse.*
7. **Roles and access.** Role-based: officers assess/escalate, managers review/recommend, admins manage the model and accounts; enforced server-side.
8. **No warranty and limited liability.** Provided "as is"; an academic prototype, not a certified lending system.
9. **Changes.** Terms may be updated; continued use means acceptance.

## Privacy Policy

1. **What data we process.** Anonymised member/loan records only: opaque client IDs, savings/salary, branch, loan terms, guarantee links. No names, national IDs, phone numbers or addresses. *Why: minimal, de-identified data limits harm.*
2. **Purpose limitation.** Used only to assess risk, explain it, and show the guarantor network; not sold, no marketing. *Why: data given for credit assessment stays used for that.*
3. **Lawful basis.** Operated under the SACCO's authority for internal credit-risk management, on already de-identified data.
4. **Who can see the data.** Only authenticated SACCO staff, limited by role; assessments are attributable to the officer who ran them. *Why: least-privilege access.*
5. **How it is protected.** Hashed passwords, signed tokens (JWT), HTTPS, secrets from the environment, opaque salted member references in the UI/URLs. *Why: defence in depth for financial data.*
6. **Re-identification prohibited.** No attempt to link records back to a named person. *Why: anonymisation only protects people if no one undoes it.*
7. **Retention.** Reference data kept while the tool operates; assessment/application records per SACCO policy.
8. **Members' rights.** The SACCO remains responsible for members' rights (access, correction, objection) through its own channels. *Why: de-identification does not cancel the duty of care.*
9. **Third parties.** Not shared externally except hosting infrastructure, used only to run the service.

---
*In-app source: `src/pages/Legal.tsx`. Update both this file and the page together.*
