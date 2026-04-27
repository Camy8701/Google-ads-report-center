import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    supabase.from("app_settings").select("*").eq("key", "global").single().then(({ data }) => setS(data));
  }, []);
  const save = async () => {
    const { error } = await supabase.from("app_settings").update({
      agency_name: s.agency_name, agency_email: s.agency_email,
      report_intro: s.report_intro, report_signoff: s.report_signoff,
      google_ads_developer_token: s.google_ads_developer_token,
      google_ads_login_customer_id: s.google_ads_login_customer_id,
      google_ads_oauth_client_id: s.google_ads_oauth_client_id,
    }).eq("key", "global");
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };
  if (!s) return <PageContainer><div className="lynck-muted">Loading…</div></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Settings" title="Agency" emphasize="defaults"
        description="Branding, report defaults, and integration placeholders."
        actions={<Button onClick={save}><Save className="size-4 mr-2" />Save</Button>}
      />

      <div className="space-y-6">
        <Card title="Branding">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Agency name"><Input value={s.agency_name} onChange={(e) => setS({ ...s, agency_name: e.target.value })} /></Field>
            <Field label="Agency email"><Input value={s.agency_email || ""} onChange={(e) => setS({ ...s, agency_email: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Report defaults">
          <Field label="Report intro paragraph">
            <Textarea rows={3} value={s.report_intro || ""} onChange={(e) => setS({ ...s, report_intro: e.target.value })} />
          </Field>
          <Field label="Report sign-off">
            <Input value={s.report_signoff || ""} onChange={(e) => setS({ ...s, report_signoff: e.target.value })} />
          </Field>
        </Card>

        <Card title="Google Ads integration (placeholder)">
          <p className="text-card-body lynck-muted mb-4">These fields are wired into the schema and edge function scaffolding so we can plug in the live Google Ads API later without restructuring.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Developer token"><Input value={s.google_ads_developer_token || ""} onChange={(e) => setS({ ...s, google_ads_developer_token: e.target.value })} placeholder="••••••••" /></Field>
            <Field label="Login customer ID"><Input value={s.google_ads_login_customer_id || ""} onChange={(e) => setS({ ...s, google_ads_login_customer_id: e.target.value })} placeholder="123-456-7890" /></Field>
            <Field label="OAuth client ID"><Input value={s.google_ads_oauth_client_id || ""} onChange={(e) => setS({ ...s, google_ads_oauth_client_id: e.target.value })} /></Field>
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">Status</label>
              <p className="text-card-body">{s.google_ads_status === "not_configured" ? "Not configured" : s.google_ads_status}</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="lynck-card p-6">
    <p className="lynck-section-label mb-4">{title}</p>
    <div className="space-y-4">{children}</div>
  </div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] uppercase tracking-[0.15em] lynck-muted mb-1.5 block">{label}</label>
    {children}
  </div>
);
