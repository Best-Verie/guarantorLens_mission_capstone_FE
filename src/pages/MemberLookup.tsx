import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { UserIcon } from "../components/icons";
import { getExamples } from "../api/member";
import { getToken } from "../lib/session";

export default function MemberLookup() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [examples, setExamples] = useState<string[]>([]);

  // Pull real example IDs from the deployed data so they never go stale.
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getExamples(token).then((e) => setExamples(e.member_ids)).catch(() => {});
  }, []);

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
          Look up a member by their account ID to see their profile, loans, and guarantor network.
        </p>

        <form onSubmit={go} className="mt-6 flex gap-2">
          <div className="flex-1">
            <TextField
              label="Member ID"
              placeholder={examples[0] ? `e.g. ${examples[0]}` : "Member ID"}
              icon={<UserIcon />}
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
        </form>
        <Button type="button" variant="primary" onClick={() => id.trim() && navigate(`/member/${encodeURIComponent(id.trim())}`)} className="mt-3">
          View member
        </Button>

        {examples.length > 0 && (
          <div className="mt-8">
            <div className="text-xs font-medium text-slate">Try one</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((ex) => (
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
        )}
      </div>
    </AppShell>
  );
}
