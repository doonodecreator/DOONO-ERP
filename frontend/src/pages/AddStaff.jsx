import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import Button from "../components/forms/Button";

export default function AddStaff({ setPage }) {
  return <PageContainer><PageHeader title="Add staff securely" subtitle="Staff accounts are created through email-bound role invitations." action={<Button variant="secondary" onClick={() => setPage?.("staff")}>Back to staff</Button>} /><SectionCard title="Use secure role invitations" subtitle="Direct staff creation with a proprietor-supplied password is disabled."><p className="text-secondary-readable">Invite the person by email so they create their own password, verify ownership of the email address, and activate the school-scoped role themselves.</p><div className="section-card-actions section-card-actions-spaced"><Button onClick={() => setPage?.("role-invitations")}>Open role invitations</Button><Button variant="secondary" onClick={() => setPage?.("staff")}>Back to staff</Button></div></SectionCard></PageContainer>;
}
