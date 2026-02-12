import { z } from 'zod';

export type Language = 'fr' | 'en';

const translations = {
  fr: {
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    loading: 'Chargement...',
    noResults: 'Aucun résultat',
    confirm: 'Confirmer',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    
    // Navigation
    home: 'Accueil',
    clients: 'Clients',
    invoices: 'Factures',
    settings: 'Paramètres',
    
    // Document types
    documentType: 'Type de document',
    invoice: 'Facture',
    quote: 'Devis',
    proforma: 'Proforma',
    creditNote: 'Avoir',
    deliveryNote: 'Bon de livraison',
    purchaseOrder: 'Bon de commande',
    
    // Invoice Generator
    newInvoice: 'Nouvelle facture',
    newQuote: 'Nouveau devis',
    createDocument: 'Créer un document',
    history: 'Historique',
    allInvoices: 'Tous',
    
    // Client section
    client: 'Client',
    clientName: 'Nom du client',
    clientCompany: 'Entreprise',
    clientEmail: 'Email',
    clientPhone: 'Téléphone',
    clientAddress: 'Adresse',
    selectClient: 'Sélectionner un client',
    searchClients: 'Rechercher par nom, email ou entreprise...',
    newClient: 'Nouveau client',
    addClient: 'Ajouter un client',
    editClient: 'Modifier le client',
    clientHistory: 'Historique client',
    returningClient: 'Client fidèle',
    totalSpent: 'Total dépensé',
    lastInvoice: 'Dernière facture',
    
    // Invoice details
    invoiceDetails: 'Détails',
    invoiceNumber: 'N° Facture',
    quoteNumber: 'N° Devis',
    documentNumber: 'N° Document',
    project: 'Projet',
    projectName: 'Nom du projet',
    invoiceDate: 'Date',
    dueDate: 'Échéance',
    onReceipt: 'À réception',
    
    // Services
    services: 'Prestations',
    addService: 'Ajouter une prestation',
    description: 'Description',
    quantity: 'Qté',
    rate: 'Prix unitaire',
    amount: 'Montant',
    
    // Calculations
    subtotal: 'Sous-total',
    tax: 'TVA',
    total: 'Total',
    discount: 'Remise',
    discountPercent: 'Remise (%)',
    discountFixed: 'Remise (fixe)',
    shipping: 'Frais de livraison',
    deposit: 'Acompte versé',
    balanceDue: 'Reste à payer',
    additionalFees: 'Frais supplémentaires',
    customLine: 'Ligne personnalisée',
    addCalculationLine: 'Ajouter une ligne de calcul',
    
    // Notes
    notes: 'Notes et conditions',
    notesPlaceholder: 'Conditions de paiement, informations supplémentaires...',
    
    // Actions
    saveInvoice: 'Enregistrer',
    exportPDF: 'Exporter PDF',
    copyLink: 'Copier le lien',
    preview: 'Aperçu',
    print: 'Imprimer',
    duplicate: 'Dupliquer',
    useAsTemplate: 'Utiliser comme modèle',
    
    // Client Dashboard
    clientManagement: 'Gestion des clients',
    totalRevenue: 'Chiffre d\'affaires total',
    pendingRevenue: 'En attente de paiement',
    totalClients: 'Total clients',
    activeClients: 'Clients actifs',
    revenueByClient: 'CA par client',
    projectStatusDistribution: 'Répartition des projets',
    clientDetails: 'Détails du client',
    projects: 'Projets',
    addProject: 'Ajouter un projet',
    allTimeEarnings: 'Gains totaux',
    awaitingPayment: 'En attente',
    
    // Status
    pending: 'En attente',
    inProgress: 'En cours',
    completed: 'Terminé',
    paid: 'Payé',
    unpaid: 'Non payé',
    partial: 'Partiel',
    overdue: 'En retard',
    
    // Settings
    businessSettings: 'Paramètres entreprise',
    businessIdentity: 'Identité',
    businessName: 'Nom de l\'entreprise',
    tagline: 'Slogan',
    ownerName: 'Nom du propriétaire',
    logo: 'Logo',
    uploadLogo: 'Télécharger un logo',
    contactInfo: 'Coordonnées',
    email: 'Email',
    phone: 'Téléphone',
    website: 'Site web',
    address: 'Adresse',
    taxSettings: 'Paramètres TVA',
    defaultTaxRate: 'Taux de TVA par défaut',
    taxLabel: 'Libellé TVA',
    currency: 'Devise',
    paymentMethods: 'Moyens de paiement',
    customFields: 'Champs personnalisés',
    footerText: 'Texte de pied de page',
    showOnInvoice: 'Afficher sur la facture',
    documentTypes: 'Types de documents',
    addDocumentType: 'Ajouter un type',
    language: 'Langue',
    
    // Price suggestions
    priceSuggestions: 'Suggestions de prix',
    basedOnHistory: 'Basé sur l\'historique',
    averageRate: 'Tarif moyen',
    lastRate: 'Dernier tarif',
    applyRate: 'Appliquer',
    
    // Messages
    invoiceSaved: 'Facture enregistrée',
    quoteSaved: 'Devis enregistré',
    documentSaved: 'Document enregistré',
    linkCopied: 'Lien copié',
    clientAdded: 'Client ajouté',
    clientUpdated: 'Client mis à jour',
    clientDeleted: 'Client supprimé',
    settingsSaved: 'Paramètres enregistrés',
    pdfReady: 'PDF prêt pour impression',
    templateApplied: 'Modèle appliqué',
    
    // Validation
    required: 'Requis',
    invalidEmail: 'Email invalide',
    invalidPhone: 'Téléphone invalide',
    
    // From/To
    from: 'De',
    to: 'À',
    
    // Date formats
    dateFormat: 'dd/MM/yyyy',
  },
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    noResults: 'No results',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    
    // Navigation
    home: 'Home',
    clients: 'Clients',
    invoices: 'Invoices',
    settings: 'Settings',
    
    // Document types
    documentType: 'Document Type',
    invoice: 'Invoice',
    quote: 'Quote',
    proforma: 'Proforma',
    creditNote: 'Credit Note',
    deliveryNote: 'Delivery Note',
    purchaseOrder: 'Purchase Order',
    
    // Invoice Generator
    newInvoice: 'New Invoice',
    newQuote: 'New Quote',
    createDocument: 'Create Document',
    history: 'History',
    allInvoices: 'All',
    
    // Client section
    client: 'Client',
    clientName: 'Client Name',
    clientCompany: 'Company',
    clientEmail: 'Email',
    clientPhone: 'Phone',
    clientAddress: 'Address',
    selectClient: 'Select Client',
    searchClients: 'Search by name, email or company...',
    newClient: 'New Client',
    addClient: 'Add Client',
    editClient: 'Edit Client',
    clientHistory: 'Client History',
    returningClient: 'Returning',
    totalSpent: 'Total Spent',
    lastInvoice: 'Last Invoice',
    
    // Invoice details
    invoiceDetails: 'Details',
    invoiceNumber: 'Invoice #',
    quoteNumber: 'Quote #',
    documentNumber: 'Document #',
    project: 'Project',
    projectName: 'Project Name',
    invoiceDate: 'Date',
    dueDate: 'Due Date',
    onReceipt: 'On Receipt',
    
    // Services
    services: 'Services',
    addService: 'Add Service',
    description: 'Description',
    quantity: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    
    // Calculations
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    discount: 'Discount',
    discountPercent: 'Discount (%)',
    discountFixed: 'Discount (fixed)',
    shipping: 'Shipping',
    deposit: 'Deposit Paid',
    balanceDue: 'Balance Due',
    additionalFees: 'Additional Fees',
    customLine: 'Custom Line',
    addCalculationLine: 'Add calculation line',
    
    // Notes
    notes: 'Notes & Terms',
    notesPlaceholder: 'Payment terms, additional information...',
    
    // Actions
    saveInvoice: 'Save',
    exportPDF: 'Export PDF',
    copyLink: 'Copy Link',
    preview: 'Preview',
    print: 'Print',
    duplicate: 'Duplicate',
    useAsTemplate: 'Use as Template',
    
    // Client Dashboard
    clientManagement: 'Client Management',
    totalRevenue: 'Total Revenue',
    pendingRevenue: 'Pending Revenue',
    totalClients: 'Total Clients',
    activeClients: 'Active Clients',
    revenueByClient: 'Revenue by Client',
    projectStatusDistribution: 'Project Status',
    clientDetails: 'Client Details',
    projects: 'Projects',
    addProject: 'Add Project',
    allTimeEarnings: 'All-time earnings',
    awaitingPayment: 'Awaiting payment',
    
    // Status
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    overdue: 'Overdue',
    
    // Settings
    businessSettings: 'Business Settings',
    businessIdentity: 'Identity',
    businessName: 'Business Name',
    tagline: 'Tagline',
    ownerName: 'Owner Name',
    logo: 'Logo',
    uploadLogo: 'Upload Logo',
    contactInfo: 'Contact Info',
    email: 'Email',
    phone: 'Phone',
    website: 'Website',
    address: 'Address',
    taxSettings: 'Tax Settings',
    defaultTaxRate: 'Default Tax Rate',
    taxLabel: 'Tax Label',
    currency: 'Currency',
    paymentMethods: 'Payment Methods',
    customFields: 'Custom Fields',
    footerText: 'Footer Text',
    showOnInvoice: 'Show on Invoice',
    documentTypes: 'Document Types',
    addDocumentType: 'Add Type',
    language: 'Language',
    
    // Price suggestions
    priceSuggestions: 'Price Suggestions',
    basedOnHistory: 'Based on history',
    averageRate: 'Average Rate',
    lastRate: 'Last Rate',
    applyRate: 'Apply',
    
    // Messages
    invoiceSaved: 'Invoice saved',
    quoteSaved: 'Quote saved',
    documentSaved: 'Document saved',
    linkCopied: 'Link copied',
    clientAdded: 'Client added',
    clientUpdated: 'Client updated',
    clientDeleted: 'Client deleted',
    settingsSaved: 'Settings saved',
    pdfReady: 'PDF ready for printing',
    templateApplied: 'Template applied',
    
    // Validation
    required: 'Required',
    invalidEmail: 'Invalid email',
    invalidPhone: 'Invalid phone',
    
    // From/To
    from: 'From',
    to: 'To',
    
    // Date formats
    dateFormat: 'MM/dd/yyyy',
  }
};

export type TranslationKey = keyof typeof translations.fr;

const LANGUAGE_STORAGE_KEY = 'app_language';

export function getLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') {
      return stored;
    }
    return 'fr'; // Default to French
  } catch {
    return 'fr';
  }
}

export function setLanguage(lang: Language): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function t(key: TranslationKey, lang?: Language): string {
  const currentLang = lang || getLanguage();
  return translations[currentLang][key] || translations.fr[key] || key;
}

export function useTranslation() {
  const lang = getLanguage();
  
  return {
    t: (key: TranslationKey) => t(key, lang),
    lang,
    setLanguage,
  };
}

// Export translations for direct access if needed
export { translations };
