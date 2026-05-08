import { create } from 'zustand';

export const translations = {
  en: {
    dashboard: 'Command Centre',
    pos: 'Point of Sale',
    inventory: 'Inventory',
    customers: 'Customers',
    suppliers: 'Suppliers',
    settings: 'Settings',
    logout: 'Exit',
    revenue: 'Daily Revenue',
    stock: 'Total Inventory',
    sales: 'Sales Volume',
    alerts: 'Low Stock Alerts',
    addProduct: 'Add Product',
    search: 'Search product...',
    total: 'Total',
    payment: 'Payment Method',
    complete: 'Complete Checkout',
    language: 'Language',
    appearance: 'Appearance',
    backup: 'Backup System',
    save: 'Save Changes',
    sku: 'SKU',
    name: 'Name',
    price: 'Price',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    accessSystem: 'Access System',
    security: 'Security',
    identities: 'Identities',
    stockEntry: 'Stock Entry',
    stockExit: 'Stock Exit',
    type: 'Type'
  },
  fr: {
    dashboard: 'Centre de Commande',
    pos: 'Point de Vente',
    inventory: 'Inventaire',
    customers: 'Clients',
    suppliers: 'Fournisseurs',
    settings: 'Paramètres',
    logout: 'Quitter',
    revenue: 'Revenu Journalier',
    stock: 'Stock Total',
    sales: 'Volume Ventes',
    alerts: 'Alertes Stock Bas',
    addProduct: 'Ajouter Produit',
    search: 'Rechercher produit...',
    total: 'Total',
    payment: 'Mode de Paiement',
    complete: 'Terminer la Vente',
    language: 'Langue',
    appearance: 'Apparence',
    backup: 'Système de Sauvegarde',
    save: 'Enregistrer',
    sku: 'Ref',
    name: 'Nom',
    price: 'Prix',
    category: 'Catégorie',
    quantity: 'Quantité',
    unit: 'Unité',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    accessSystem: 'Accéder au Système',
    security: 'Sécurité',
    identities: 'Identités',
    stockEntry: 'Entrée Stock',
    stockExit: 'Sortie Stock',
    type: 'Type'
  }
};

interface LangState {
  lang: 'en' | 'fr';
  setLang: (lang: 'en' | 'fr') => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: (localStorage.getItem('lang') as 'en' | 'fr') || 'en',
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  }
}));

export const useTranslation = () => {
  const { lang } = useLangStore();
  const t = (key: keyof typeof translations.en) => translations[lang][key] || key;
  return { t, lang };
};
