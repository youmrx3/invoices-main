import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Plus, TrendingUp, Eye, Trash2, Edit, BarChart3, PieChart, 
  ArrowLeft, Clock, Search, FileText, Calendar, DollarSign, 
  Building, Mail, Phone, MapPin, Star, Trophy, ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart as RechartsPieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { safeParseJSON, generateSecureId, getSavedInvoices, type SavedInvoice } from '@/lib/safeStorage';
import { t, getLanguage } from '@/lib/i18n';
import { z } from 'zod';
import LanguageSelector from './LanguageSelector';

// Zod schemas for validation
const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']),
  paidAmount: z.number(),
  startDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
});

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().default(''),
  email: z.string(),
  phone: z.string().default(''),
  address: z.string().default(''),
  projects: z.array(ProjectSchema).default([]),
  totalRevenue: z.number().default(0),
  createdAt: z.string(),
});

const ClientsArraySchema = z.array(ClientSchema);

interface Project {
  id: string;
  name: string;
  description: string;
  price: number;
  status: 'pending' | 'in-progress' | 'completed';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
  startDate: string;
  dueDate: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  projects: Project[];
  totalRevenue: number;
  createdAt: string;
}

const ClientManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const lang = getLanguage();
  
  const [clients, setClients] = useState<Client[]>(() => {
    const parsed = safeParseJSON(localStorage.getItem('clients'), ClientsArraySchema, []);
    return parsed as Client[];
  });
  
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New client form
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });

  // New project form
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    price: 0,
    status: 'pending' as Project['status'],
    paymentStatus: 'unpaid' as Project['paymentStatus'],
    paidAmount: 0,
    startDate: '',
    dueDate: ''
  });

  // Load invoices
  useEffect(() => {
    setInvoices(getSavedInvoices());
  }, []);

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  // Filter clients by search
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get client invoices
  const getClientInvoices = (client: Client): SavedInvoice[] => {
    return invoices.filter(
      inv => inv.clientName?.toLowerCase() === client.name.toLowerCase() ||
             inv.clientEmail?.toLowerCase() === client.email.toLowerCase()
    );
  };

  // Calculate revenue from invoices for a client
  const getClientInvoiceRevenue = (client: Client): number => {
    return getClientInvoices(client).reduce((sum, inv) => sum + (inv.total || 0), 0);
  };

  const addClient = () => {
    if (!newClient.name || !newClient.email) {
      toast({
        title: "Error",
        description: lang === 'fr' ? "Veuillez remplir le nom et l'email." : "Please fill in name and email.",
        variant: "destructive"
      });
      return;
    }

    const client: Client = {
      id: generateSecureId(),
      ...newClient,
      projects: [],
      totalRevenue: 0,
      createdAt: new Date().toISOString()
    };

    setClients(prev => [...prev, client]);
    setNewClient({ name: '', company: '', email: '', phone: '', address: '' });
    setShowAddClient(false);

    toast({
      title: t('clientAdded'),
      description: `${client.name}`,
    });
  };

  const updateClient = () => {
    if (!editingClient || !editingClient.name || !editingClient.email) {
      toast({
        title: "Error",
        description: lang === 'fr' ? "Veuillez remplir les champs requis." : "Please fill in required fields.",
        variant: "destructive"
      });
      return;
    }

    setClients(prev => prev.map(client => 
      client.id === editingClient.id ? editingClient : client
    ));
    setEditingClient(null);
    
    toast({
      title: t('clientUpdated'),
      description: editingClient.name,
    });
  };

  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
    
    toast({
      title: t('clientDeleted'),
    });
  };

  const addProject = () => {
    if (!selectedClient || !newProject.name || newProject.price <= 0) {
      toast({
        title: "Error",
        description: lang === 'fr' ? "Veuillez remplir tous les champs du projet." : "Please fill in all project fields.",
        variant: "destructive"
      });
      return;
    }

    const project: Project = {
      id: generateSecureId(),
      ...newProject,
      createdAt: new Date().toISOString()
    };

    setClients(prev => prev.map(client => 
      client.id === selectedClient.id 
        ? { 
            ...client, 
            projects: [...client.projects, project],
            totalRevenue: client.totalRevenue + newProject.paidAmount
          }
        : client
    ));

    setNewProject({
      name: '',
      description: '',
      price: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      paidAmount: 0,
      startDate: '',
      dueDate: ''
    });
    setShowAddProject(false);

    toast({
      title: t('addProject'),
      description: project.name,
    });
  };

  const deleteProject = (projectId: string) => {
    if (!selectedClient) return;

    setClients(prev => prev.map(client => {
      if (client.id === selectedClient.id) {
        const projectToDelete = client.projects.find(p => p.id === projectId);
        const updatedProjects = client.projects.filter(p => p.id !== projectId);
        
        return {
          ...client,
          projects: updatedProjects,
          totalRevenue: client.totalRevenue - (projectToDelete?.paidAmount || 0)
        };
      }
      return client;
    }));

    toast({
      title: t('delete'),
    });
  };

  // Stats calculations
  const calculateTotalRevenue = () => {
    const projectRevenue = clients.reduce((total, client) => total + client.totalRevenue, 0);
    const invoiceRevenue = invoices.reduce((total, inv) => total + (inv.total || 0), 0);
    return Math.max(projectRevenue, invoiceRevenue);
  };

  const calculatePendingRevenue = () => {
    return clients.reduce((total, client) => {
      const pending = client.projects.reduce((sum, project) => {
        return sum + (project.price - project.paidAmount);
      }, 0);
      return total + pending;
    }, 0);
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: Project['paymentStatus']) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'partial': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Top clients by revenue
  const getTopClients = () => {
    return [...clients]
      .map(client => ({
        ...client,
        combinedRevenue: client.totalRevenue + getClientInvoiceRevenue(client)
      }))
      .sort((a, b) => b.combinedRevenue - a.combinedRevenue)
      .slice(0, 5);
  };

  // Revenue chart data
  const getRevenueChartData = () => {
    return clients.slice(0, 8).map(client => ({
      name: client.name.split(' ')[0],
      revenue: client.totalRevenue + getClientInvoiceRevenue(client),
      pending: client.projects.reduce((sum, p) => sum + (p.price - p.paidAmount), 0)
    }));
  };

  // Monthly revenue data
  const getMonthlyRevenueData = () => {
    const months: { [key: string]: number } = {};
    
    invoices.forEach(inv => {
      if (inv.invoiceDate) {
        const date = new Date(inv.invoiceDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[key] = (months[key] || 0) + (inv.total || 0);
      }
    });
    
    const sortedKeys = Object.keys(months).sort();
    return sortedKeys.slice(-6).map(key => {
      const [year, month] = key.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' });
      return { name: monthName, revenue: months[key] };
    });
  };

  // Project status data
  const getProjectStatusData = () => {
    const allProjects = clients.flatMap(c => c.projects);
    const statusCount = allProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status === 'pending' ? t('pending') : status === 'in-progress' ? t('inProgress') : t('completed'),
      value: count,
      color: status === 'pending' ? '#f59e0b' : status === 'in-progress' ? '#3b82f6' : '#10b981'
    }));
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const createInvoiceForClient = (client: Client) => {
    // Store selected client in sessionStorage and navigate
    sessionStorage.setItem('selectedClientForInvoice', JSON.stringify({
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
      address: client.address,
    }));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('clientManagement')}</h1>
                <p className="text-sm text-muted-foreground">
                  {clients.length} {t('clients').toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    {t('addClient')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('addClient')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>{t('clientName')} *</Label>
                      <Input
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('clientName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('clientCompany')}</Label>
                      <Input
                        value={newClient.company}
                        onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                        placeholder={t('clientCompany')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('email')} *</Label>
                      <Input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('email')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('phone')}</Label>
                      <Input
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('phone')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('address')}</Label>
                      <Textarea
                        value={newClient.address}
                        onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                        placeholder={t('address')}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowAddClient(false)} className="flex-1">
                        {t('cancel')}
                      </Button>
                      <Button onClick={addClient} className="flex-1">
                        {t('add')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalRevenue')}</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {calculateTotalRevenue().toFixed(0)} DZD
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('allTimeEarnings')}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('pendingRevenue')}</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {calculatePendingRevenue().toFixed(0)} DZD
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('awaitingPayment')}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalClients')}</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('activeClients')}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices')}</CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{invoices.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{lang === 'fr' ? 'Total factures' : 'Total invoices'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {lang === 'fr' ? 'Évolution du CA' : 'Revenue Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMonthlyRevenueData()}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {lang === 'fr' ? 'Top Clients' : 'Top Clients'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopClients().map((client, index) => (
                  <div 
                    key={client.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.company || client.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">{client.combinedRevenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">DZD</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t('revenueByClient')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getRevenueChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name={t('totalRevenue')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name={t('pendingRevenue')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                {t('projectStatusDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={getProjectStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getProjectStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Search and Client List */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchClients')}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clients List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t('clients')} ({filteredClients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-xl font-semibold mb-2">{t('noResults')}</h3>
                      <p className="text-sm">{t('addClient')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredClients.map((client) => {
                        const clientInvoices = getClientInvoices(client);
                        const invoiceRevenue = getClientInvoiceRevenue(client);
                        const isSelected = selectedClient?.id === client.id;
                        
                        return (
                          <div
                            key={client.id}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border hover:border-primary/30 bg-card hover:shadow-sm'
                            }`}
                            onClick={() => setSelectedClient(client)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground truncate">{client.name}</h4>
                                  {clientInvoices.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {clientInvoices.length} {t('invoices').toLowerCase()}
                                    </Badge>
                                  )}
                                </div>
                                {client.company && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {client.company}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {client.email}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">
                                  {(client.totalRevenue + invoiceRevenue).toFixed(0)} DZD
                                </p>
                                <p className="text-xs text-muted-foreground">{t('totalRevenue')}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createInvoiceForClient(client);
                                }}
                                className="gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                {t('newInvoice')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(client);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteClient(client.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  {t('clientDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClient ? (
                  <div className="space-y-6">
                    {/* Client Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {selectedClient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedClient.name}</h3>
                          {selectedClient.company && (
                            <p className="text-muted-foreground">{selectedClient.company}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{t('email')}</p>
                          <p className="text-sm font-medium">{selectedClient.email}</p>
                        </div>
                        {selectedClient.phone && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{t('phone')}</p>
                            <p className="text-sm font-medium">{selectedClient.phone}</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedClient.address && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{t('address')}</p>
                          <p className="text-sm font-medium whitespace-pre-line">{selectedClient.address}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Client Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">{t('totalRevenue')}</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">
                          {(selectedClient.totalRevenue + getClientInvoiceRevenue(selectedClient)).toFixed(0)} DZD
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">{t('invoices')}</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {getClientInvoices(selectedClient).length}
                        </p>
                      </div>
                    </div>

                    {/* Recent Invoices */}
                    {getClientInvoices(selectedClient).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {lang === 'fr' ? 'Factures récentes' : 'Recent Invoices'}
                        </h4>
                        <div className="space-y-2">
                          {getClientInvoices(selectedClient).slice(0, 5).map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-mono text-sm font-medium">{inv.invoiceNumber}</p>
                                <p className="text-xs text-muted-foreground">{inv.projectName || '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">{inv.total?.toFixed(0)} DZD</p>
                                <p className="text-xs text-muted-foreground">{inv.invoiceDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {selectedClient.projects.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {t('projects')}
                          </h4>
                          <Button variant="outline" size="sm" onClick={() => setShowAddProject(true)}>
                            <Plus className="w-3 h-3 mr-1" />
                            {t('addProject')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {selectedClient.projects.map((project) => (
                            <div key={project.id} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">{project.name}</p>
                                <div className="flex gap-1">
                                  <Badge className={getStatusColor(project.status)}>
                                    {project.status === 'pending' ? t('pending') : 
                                     project.status === 'in-progress' ? t('inProgress') : t('completed')}
                                  </Badge>
                                  <Badge className={getPaymentStatusColor(project.paymentStatus)}>
                                    {project.paymentStatus === 'unpaid' ? t('unpaid') :
                                     project.paymentStatus === 'partial' ? t('partial') : t('paid')}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{project.paidAmount.toFixed(0)} / {project.price.toFixed(0)} DZD</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deleteProject(project.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => createInvoiceForClient(selectedClient)} 
                        className="flex-1 gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {t('newInvoice')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">{t('selectClient')}</h3>
                    <p className="text-sm">{lang === 'fr' ? 'Cliquez sur un client pour voir les détails' : 'Click a client to view details'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editClient')}</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('clientName')} *</Label>
                <Input
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('clientCompany')}</Label>
                <Input
                  value={editingClient.company}
                  onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('email')} *</Label>
                <Input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('phone')}</Label>
                <Input
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('address')}</Label>
                <Textarea
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingClient(null)} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button onClick={updateClient} className="flex-1">
                  {t('save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('projectName')} *</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('projectName')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{lang === 'fr' ? 'Prix' : 'Price'} *</Label>
                <Input
                  type="number"
                  value={newProject.price}
                  onChange={(e) => setNewProject(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'fr' ? 'Montant payé' : 'Paid Amount'}</Label>
                <Input
                  type="number"
                  value={newProject.paidAmount}
                  onChange={(e) => setNewProject(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddProject(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={addProject} className="flex-1">
                {t('add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;
