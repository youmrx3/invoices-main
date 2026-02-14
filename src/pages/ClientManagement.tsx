
import ClientManagement from '@/components/ClientManagement';
import WorkspaceShell from '@/components/layout/WorkspaceShell';

const ClientManagementPage = () => {
  return (
    <WorkspaceShell
      title="Client Management"
      subtitle="Track customers, payments, remaining balances, and portfolio performance"
    >
      <ClientManagement />
    </WorkspaceShell>
  );
};

export default ClientManagementPage;
