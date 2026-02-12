import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import InvoiceGenerator from '@/components/InvoiceGenerator';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <Link to="/clients">
          <Button variant="outline" size="sm" className="gap-2 shadow-md bg-background">
            <Users className="w-4 h-4" />
            Clients
          </Button>
        </Link>
      </div>

      {/* Invoice Generator */}
      <InvoiceGenerator />
    </div>
  );
};

export default Index;
