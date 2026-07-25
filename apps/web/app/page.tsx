import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  TBody,
  TD,
  TH,
  THead,
  ThemeSwitcher,
  TR,
  type BadgeProps,
} from "@justice/ui";

type CaseRow = {
  number: string;
  defendant: string;
  domain: "LE" | "Prosecution" | "Courts";
  charge: string;
  state: "Draft" | "Review" | "Approved" | "Filed" | "Rejected";
  updated: string;
};

const CASES: CaseRow[] = [
  { number: "2026-CR-004182", defendant: "Vale, Jordan", domain: "Courts", charge: "La. R.S. 14:67(B)", state: "Filed", updated: "2m ago" },
  { number: "2026-CR-004181", defendant: "Okafor, Amara", domain: "Prosecution", charge: "La. R.S. 14:34", state: "Review", updated: "14m ago" },
  { number: "2026-CR-004179", defendant: "Reyes, Diego", domain: "LE", charge: "La. R.S. 40:966", state: "Draft", updated: "1h ago" },
  { number: "2026-CR-004175", defendant: "Nakamura, Kenji", domain: "Prosecution", charge: "La. R.S. 14:98", state: "Approved", updated: "3h ago" },
  { number: "2026-CR-004168", defendant: "Bauer, Sofia", domain: "LE", charge: "La. R.S. 14:65", state: "Rejected", updated: "yesterday" },
];

const STATE_VARIANT: Record<CaseRow["state"], BadgeProps["variant"]> = {
  Draft: "neutral",
  Review: "warning",
  Approved: "success",
  Filed: "info",
  Rejected: "destructive",
};

export default function Page() {
  return (
    <div className="grid min-h-dvh grid-cols-[13rem_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col gap-1 border-r border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
        <div className="px-2 py-2 text-md font-semibold">Justice Suite</div>
        <nav className="flex flex-col gap-0.5 text-sm">
          {[
            ["Cases", true],
            ["Law Enforcement", false],
            ["Prosecution", false],
            ["Courts", false],
            ["People", false],
            ["Evidence", false],
            ["Admin · Forms", false],
          ].map(([label, active]) => (
            <a
              key={label as string}
              href="#"
              className={
                "rounded-md px-2 py-1.5 " +
                (active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-2">
          <Input
            className="max-w-xs"
            placeholder="Search cases, people, statutes…  (⌘K)"
            aria-label="Global search"
          />
          <div className="ml-auto flex items-center gap-3">
            <ThemeSwitcher />
            <Button size="sm">New Case</Button>
          </div>
        </header>

        <main className="flex flex-col gap-4 p-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Open cases", "1,284"],
              ["Awaiting screening", "37"],
              ["Filed this week", "112"],
              ["Drafts", "19"],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xl font-semibold tabular-nums">
                    {value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Active Cases</CardTitle>
                <CardDescription>
                  Shared canonical records across LE, Prosecution, and Courts.
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm">
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable>
                <THead>
                  <tr>
                    <TH>Case #</TH>
                    <TH>Defendant</TH>
                    <TH>Domain</TH>
                    <TH>Lead charge</TH>
                    <TH>State</TH>
                    <TH numeric>Updated</TH>
                  </tr>
                </THead>
                <TBody>
                  {CASES.map((c, i) => (
                    <TR key={c.number} selected={i === 0}>
                      <TD mono>{c.number}</TD>
                      <TD>{c.defendant}</TD>
                      <TD>
                        <Badge variant="outline">{c.domain}</Badge>
                      </TD>
                      <TD mono>{c.charge}</TD>
                      <TD>
                        <Badge variant={STATE_VARIANT[c.state]}>{c.state}</Badge>
                      </TD>
                      <TD numeric className="text-muted-foreground">
                        {c.updated}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>

          {/* Control palette preview */}
          <Card>
            <CardHeader>
              <CardTitle>Component palette</CardTitle>
              <CardDescription>
                Buttons, badges, and inputs — all reading from semantic theme
                tokens. Switch themes above to see them recolor.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <span className="mx-2 h-5 w-px bg-border" />
              <Badge>Default</Badge>
              <Badge variant="success">Approved</Badge>
              <Badge variant="warning">Review</Badge>
              <Badge variant="info">Filed</Badge>
              <Badge variant="destructive">Rejected</Badge>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
