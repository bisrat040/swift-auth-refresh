import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  LayoutGrid, 
  List as ListIcon, 
  Building2,
  MapPin,
  Home,
  Users,
  Wrench,
  TrendingUp,
  LayoutDashboard,
  Filter,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit,
  Building,
  Loader2,
  Shield,
  Crown,
  Timer,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Property, Unit } from '../types';
import { toast } from 'sonner';
import { PropertyModal } from './modals/PropertyModal';
import { UnitModal } from './modals/UnitModal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export const Properties: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);

  const { properties, units, isLoading } = useData();
  const { isSuperAdmin } = useUser();

  const filteredProperties = (properties || []).filter(p => {
    if (!p) return false;
    const name = String(p.name || '');
    const address = String(p.address || '');
    const type = String(p.type || '');
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All Types' || type === filterType;
    return matchesSearch && matchesType;
  });

  const getPropertyStats = (propertyId: string) => {
    const propertyUnits = (units || []).filter(u => u.propertyId === propertyId);
    const occupiedUnits = propertyUnits.filter(u => u.status === 'Occupied').length;
    const maintenanceUnits = propertyUnits.filter(u => u.status === 'Maintenance').length;
    const totalRent = propertyUnits.reduce((sum, u) => sum + (Number(u.rentAmount) || 0), 0);
    
    return {
      totalUnits: propertyUnits.length,
      occupiedUnits,
      vacantUnits: propertyUnits.length - occupiedUnits - maintenanceUnits,
      maintenanceUnits,
      occupancyRate: propertyUnits.length > 0 ? Math.round((occupiedUnits / propertyUnits.length) * 100) : 0,
      monthlyRevenue: totalRent
    };
  };

  const handleAddProperty = () => {
    setEditingProperty(undefined);
    setIsPropertyModalOpen(true);
  };

  const handleEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setIsPropertyModalOpen(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? All units and related data will be affected.')) return;
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      toast.success('Property deleted successfully');
      if (selectedProperty?.id === id) setSelectedProperty(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete property');
    }
  };

  const handleAddUnit = () => {
    setEditingUnit(undefined);
    setIsUnitModalOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
      toast.success('Unit deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete unit');
    }
  };

  const getSubscriptionBadge = (property: Property) => {
    if (!property.subscriptionTier) return null;

    const tier = property.subscriptionTier;
    const status = property.subscriptionStatus || 'active';

    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
        tier === 'PRO' ? "bg-indigo-500 text-white" : 
        tier === 'DEMO' ? "bg-amber-500 text-white" : "bg-slate-600 text-white"
      )}>
        {tier === 'PRO' ? <Crown className="w-2.5 h-2.5" /> : tier === 'DEMO' ? <Timer className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
        {tier}
        {status !== 'active' && <span className="opacity-80">• {status}</span>}
      </div>
    );
  };

  if (selectedProperty) {
    const propertyUnits = (units || []).filter(u => u.propertyId === selectedProperty.id);
    const stats = getPropertyStats(selectedProperty.id);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-500"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{selectedProperty.name || 'Untitled Property'}</h2>
                {getSubscriptionBadge(selectedProperty)}
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selectedProperty.address || 'No address provided'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleEditProperty(selectedProperty)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-slate-50 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit Details
            </button>
            <button 
              onClick={handleAddUnit}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </button>
          </div>
        </div>

        {isSuperAdmin && selectedProperty.subscriptionTier && (
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tier Level</p>
                <p className="text-sm font-black text-indigo-900">{selectedProperty.subscriptionTier} Plan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Billing Rate</p>
                <p className="text-sm font-black text-indigo-900">{formatCurrency(selectedProperty.subscriptionPrice || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Valid Until</p>
                <p className="text-sm font-black text-indigo-900">
                  {selectedProperty.subscriptionExpiry ? format(new Date(selectedProperty.subscriptionExpiry), 'MMM dd, yyyy') : 'No Expiry'}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                selectedProperty.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", selectedProperty.subscriptionStatus === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                {selectedProperty.subscriptionStatus}
              </div>
              <button 
                onClick={() => handleEditProperty(selectedProperty)}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold uppercase tracking-wider"
              >
                Change Plan
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-indigo-50 rounded-lg w-fit mb-3"><Home className="w-5 h-5 text-indigo-600" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy</p>
            <h3 className="text-xl font-black text-slate-900">{stats.occupiedUnits} / {stats.totalUnits}</h3>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-emerald-50 rounded-lg w-fit mb-3"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
            <h3 className="text-xl font-black text-slate-900">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">+2.4% from last month</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-rose-50 rounded-lg w-fit mb-3"><Wrench className="w-5 h-5 text-rose-600" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
            <h3 className="text-xl font-black text-slate-900">{stats.maintenanceUnits}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Units needing attention</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-lg w-fit mb-3"><Building className="w-5 h-5 text-amber-600" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</p>
            <h3 className="text-xl font-black text-slate-900">{selectedProperty.type || 'N/A'}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Property Classification</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Units in {selectedProperty.name || 'this property'}</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search units..."
                  className="pl-9 pr-4 py-1.5 text-xs border-slate-200 rounded-lg focus:ring-indigo-500 w-48 shadow-none"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Floor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Rent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {propertyUnits.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">Unit {unit.number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{unit.type || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{unit.floor || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        unit.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600' : 
                        unit.status === 'Vacant' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {unit.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(unit.rentAmount || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditUnit(unit)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {propertyUnits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Home className="w-8 h-8 opacity-20" />
                        <p>No units found for this property.</p>
                        <button onClick={handleAddUnit} className="text-indigo-600 font-bold text-sm">Add first unit</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <UnitModal 
          isOpen={isUnitModalOpen} 
          onClose={() => setIsUnitModalOpen(false)} 
          unit={editingUnit} 
          propertyId={selectedProperty.id} 
        />
        <PropertyModal 
          isOpen={isPropertyModalOpen} 
          onClose={() => setIsPropertyModalOpen(false)} 
          property={editingProperty} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Property Portfolio</h2>
          <p className="text-slate-500 text-sm font-medium">Manage your real estate assets and multi-unit complexes</p>
        </div>
        <button 
          onClick={handleAddProperty}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Property
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search properties by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4" />
            <select 
              className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>All Types</option>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Mixed-Use</option>
              <option>Industrial</option>
            </select>
          </div>
          <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400')}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div key="loading" className="flex items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProperties.map(property => {
              const stats = getPropertyStats(property.id);
              return (
                <motion.div
                  key={property.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={property.imageUrl || `https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1073&auto=format&fit=crop`} 
                      alt={property.name || 'Property'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditProperty(property); }}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-slate-600 hover:text-indigo-600 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteProperty(property.id); }}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-slate-600 hover:text-rose-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md",
                        property.status === 'Active' ? "bg-emerald-500/80 text-white" : "bg-amber-500/80 text-white"
                      )}>
                        {property.status || 'Active'}
                      </span>
                      {isSuperAdmin && getSubscriptionBadge(property)}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900">{property.name || 'Untitled Property'}</h3>
                      </div>
                      <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {property.address || 'No address provided'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy</p>
                        <p className="text-sm font-black text-slate-900">{stats.occupancyRate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</p>
                        <p className="text-sm font-black text-slate-900">{stats.totalUnits}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedProperty(property)}
                      className="w-full py-3 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      Manage Property
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Occupancy</th>
                  <th className="px-6 py-4">Units</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map(property => {
                  const stats = getPropertyStats(property.id);
                  return (
                    <tr key={property.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-slate-900">{property.name || 'Untitled'}</div>
                              {isSuperAdmin && getSubscriptionBadge(property)}
                            </div>
                            <div className="text-[10px] text-slate-500">{property.address || 'No address'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{property.type || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${stats.occupancyRate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{stats.occupancyRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{stats.totalUnits}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedProperty(property)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditProperty(property)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProperty(property.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredProperties.length === 0 && !isLoading && (
        <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No properties found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-8">Start by adding your first property to manage units and tenants.</p>
          <button 
            onClick={handleAddProperty}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Add New Property
          </button>
        </div>
      )}

      <PropertyModal 
        isOpen={isPropertyModalOpen} 
        onClose={() => setIsPropertyModalOpen(false)} 
        property={editingProperty} 
      />
    </div>
  );
};