import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { UserIcon } from "../components/icons";

const EXAMPLES = ["Gasabo-366", "Gasabo-314", "Gasabo-335", "Kicukiro-1", "Nyarugenge-1"];

export default function MemberLookup() {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  function go(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = id.trim();
    if (v) navigate(`/member/${encodeURIComponent(v)}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-ink">Members</h1>
        <p className="mt-1 text-sm text-slate">
          Look up a member by ID, e.g. Gasabo-335. IDs run Gasabo-1 to Gasabo-700,
          and the same for Kicukiro and Nyarugenge.
        </p>

        <form onSubmit={go} className="mt-6 flex gap-2">
          <div className="flex-1">
            <TextField
              label="Member ID"
              placeholder="e.g. Gasabo-366"
              icon={<UserIcon />}
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
        </form>
        <Button type="button" variant="primary" onClick={() => id.trim() && navigate(`/member/${encodeURIComponent(id.trim())}`)} className="mt-3">
          View member
        </Button>

        <div className="mt-8">
          <div className="text-xs font-medium text-slate">Try one</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => navigate(`/member/${encodeURIComponent(ex)}`)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 font-mono text-sm text-brand hover:bg-brand-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
