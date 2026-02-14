import InvoiceGenerator from '@/components/InvoiceGenerator';
import WorkspaceShell from '@/components/layout/WorkspaceShell';

const Index = () => {
  return (
    <WorkspaceShell
      title="Invoice Workspace"
      subtitle="Create documents, manage clients, and control payments from one place"
    >
      <InvoiceGenerator />
    </WorkspaceShell>
  );
};

export default Index;
