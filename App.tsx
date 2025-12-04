
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  MessageCircle, 
  Bot, 
  Settings, 
  Menu,
  X,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  Smartphone,
  Save,
  Megaphone,
  BookOpen,
  Clock,
  Check,
  MessageSquare,
  MoreVertical,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Users,
  Terminal,
  ChevronRight,
  LogOut,
  Plus,
  Power
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { CompanyResult, Status, CampaignStatus, WhatsAppSession, AIConfig, KnowledgeRule } from './types';
import { MOCK_DATA, DEFAULT_AI_PERSONA, DEFAULT_KNOWLEDGE_RULES } from './constants';

// --- Custom Hooks ---

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

// --- UI Components Helpers ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center space-x-3 px-5 py-3.5 mb-1.5 transition-all duration-300 group rounded-xl mx-2 ${
      active 
        ? 'text-white bg-slate-800 shadow-lg shadow-black/20' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}
    style={{width: 'calc(100% - 16px)'}}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
    )}
    
    <Icon size={20} className={`relative z-10 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
    <span className="relative z-10 font-medium text-sm tracking-wide">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => {
  const textColor = color.replace('bg-', 'text-');
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
         <Icon size={80} className={textColor} />
      </div>
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 shadow-sm`}>
          <Icon size={22} className={textColor} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {trendValue}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</h3>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

// --- Views ---

const DashboardView = ({ data }: { data: CompanyResult[] }) => {
  const stats = useMemo(() => {
    const total = data.length;
    const success = data.filter(d => d.status === Status.SUCCESS).length;
    const withPhone = data.filter(d => d.telefone).length;
    const campaignSent = data.filter(d => d.campaignStatus === CampaignStatus.SENT || d.campaignStatus === CampaignStatus.REPLIED).length;
    return { total, success, withPhone, campaignSent };
  }, [data]);

  const chartData = [
    { name: 'Com Telefone', value: stats.withPhone },
    { name: 'Sem Telefone', value: stats.total - stats.withPhone },
  ];

  const statusData = [
    { name: 'Pendentes', value: data.filter(d => d.campaignStatus === CampaignStatus.PENDING).length },
    { name: 'Enviadas', value: data.filter(d => d.campaignStatus === CampaignStatus.SENT).length },
    { name: 'Respondidas', value: data.filter(d => d.campaignStatus === CampaignStatus.REPLIED).length },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Importado" value={stats.total} icon={Briefcase} color="bg-blue-600" trend="up" trendValue="+12%" />
        <StatCard title="Leads Válidos" value={stats.withPhone} icon={Smartphone} color="bg-emerald-600" trend="up" trendValue="+5%" />
        <StatCard title="Disparos" value={stats.campaignSent} icon={Send} color="bg-indigo-600" trend="up" trendValue="+24%" />
        <StatCard title="Conversão" value="15%" icon={MessageSquare} color="bg-violet-600" trend="down" trendValue="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Performance da Campanha</h3>
              <p className="text-sm text-slate-400">Evolução de contatos e respostas</p>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 text-xs">Ver Relatório</button>
          </div>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statusData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Qualidade da Base</h3>
            <p className="text-sm text-slate-400 mb-6">Proporção de contatos acionáveis</p>
          </div>
          
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F1F5F9'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-800 tracking-tight">{Math.round((stats.withPhone / stats.total) * 100)}%</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Acionável</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                <span className="text-sm font-medium text-slate-600">Com WhatsApp</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span className="text-sm font-medium text-slate-400">Inválido</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadView = ({ onUpload }: { onUpload: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSimulatedUpload = () => {
    setIsProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          onUpload();
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center animate-fade-in pb-24">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Importar Dados da SEFAZ</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Carregue o PDF oficial de inaptidão. Nossa IA processará e classificará cada empresa automaticamente.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-12 text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-all duration-1000 group-hover:bg-blue-500/10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 transition-all duration-1000 group-hover:bg-emerald-500/10"></div>

        <div 
          className={`relative z-10 border-4 border-dashed rounded-3xl p-16 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] bg-white/50 backdrop-blur-sm ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { 
            e.preventDefault(); 
            setIsDragging(false); 
            handleSimulatedUpload();
          }}
        >
          <div className="w-24 h-24 bg-white text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-slate-200 transform transition-transform group-hover:scale-110 group-hover:rotate-3 border border-slate-100">
            {isProcessing ? <Loader2 className="animate-spin text-blue-600" size={48} /> : <Upload size={48} strokeWidth={1.5} />}
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            {isProcessing ? 'Analisando Documento...' : 'Arraste e solte seu PDF aqui'}
          </h3>
          <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
            Suportamos arquivos PDF gerados diretamente pelo portal da SEFAZ/BA. Extração automática de I.E., Razão Social e Motivos.
          </p>
          
          {!isProcessing && (
            <button 
              onClick={handleSimulatedUpload}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-500/30 transform hover:-translate-y-1 transition-all duration-200 active:scale-95 cursor-pointer btn-primary"
            >
              <Upload size={24} />
              Selecionar Arquivo
            </button>
          )}

          {isProcessing && (
            <div className="w-full max-w-md mt-6">
              <div className="flex justify-between text-sm font-bold mb-3">
                <span className="text-slate-700">Extraindo dados e classificando...</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 ease-out relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultsView = ({ data }: { data: CompanyResult[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredData = data.filter(item => 
    item.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inscricaoEstadual.includes(searchTerm) ||
    item.cnpj.includes(searchTerm)
  );

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map(d => d.id)));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-140px)] animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="relative w-96 group">
          <input
            type="text"
            placeholder="Buscar empresa, CNPJ ou IE..."
            className="w-full px-4 py-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold rounded-xl hover:bg-emerald-100 hover:border-emerald-200 transition-all">
            <FileSpreadsheet size={18} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-5 border-b border-slate-200 w-16 text-center">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
              <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos</th>
              <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</th>
              <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Status SEFAZ</th>
              <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredData.map((row) => (
              <tr key={row.id} className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50/40' : ''}`}>
                <td className="p-5 text-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelection(row.id)}
                  />
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner">
                      {row.razaoSocial.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{row.razaoSocial}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                        <Users size={12} />
                        {row.nomeContador || 'Sem contador'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                   <div className="space-y-1.5">
                     <span className="inline-block px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-mono border border-slate-200 font-bold">
                       {row.cnpj}
                     </span>
                     <div className="text-xs text-slate-500 pl-1 font-medium">IE: {row.inscricaoEstadual}</div>
                   </div>
                </td>
                <td className="p-5 text-sm font-semibold text-slate-600">{row.municipio}</td>
                <td className="p-5">
                  <div className="flex flex-col items-start gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      row.situacaoCadastral === 'ATIVA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      row.situacaoCadastral === 'INAPTA' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        row.situacaoCadastral === 'ATIVA' ? 'bg-emerald-500' :
                        row.situacaoCadastral === 'INAPTA' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }`}></span>
                      {row.situacaoCadastral}
                    </span>
                    {row.motivoSituacao && (
                      <span className="text-[11px] leading-tight text-slate-500 max-w-[180px] truncate opacity-75 hover:opacity-100 transition-opacity" title={row.motivoSituacao}>
                        {row.motivoSituacao}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-5">
                  {row.telefone ? (
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl w-fit border border-slate-100 group-hover:border-slate-200 transition-colors">
                      <div className="p-1 bg-green-500 text-white rounded-full shadow-sm shadow-green-200">
                        <Smartphone size={12} fill="currentColor" />
                      </div>
                      <span className="text-sm font-bold">{row.telefone}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs italic pl-2">Sem número</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Campaign View ---

const CampaignView = ({ data, config }: { data: CompanyResult[], config: AIConfig }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'replied'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [motivoFilter, setMotivoFilter] = useState<string>('all');
  const [initialMessage, setInitialMessage] = useLocalStorage('initialMessage', 
    'Olá, falo com o responsável pela {Empresa}? Aqui é Lucas.\nNotei que sua empresa está com pendência na SEFAZ ({Motivo}).\nPodemos regularizar isso hoje?'
  );

  const availableMotivos = useMemo(() => {
    const motivos = new Set(data.map(c => c.motivoSituacao).filter(m => m));
    return Array.from(motivos).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    let base = [];
    switch(activeTab) {
      case 'pending': 
        base = data.filter(d => d.campaignStatus === CampaignStatus.PENDING && d.telefone);
        break;
      case 'sent':
        base = data.filter(d => d.campaignStatus === CampaignStatus.SENT || d.campaignStatus === CampaignStatus.QUEUED);
        break;
      case 'replied':
        base = data.filter(d => d.campaignStatus === CampaignStatus.REPLIED);
        break;
      default: base = [];
    }
    
    if (motivoFilter !== 'all') {
      return base.filter(d => d.motivoSituacao === motivoFilter);
    }
    return base;
  }, [data, activeTab, motivoFilter]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const hasRule = (motivo: string) => {
    return config.knowledgeRules.some(r => r.motivoSituacao === motivo && r.isActive);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in gap-6">
      {/* Filters and Config */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                {['pending', 'sent', 'replied'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                      activeTab === tab 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'pending' && 'Fila de Envio'}
                    {tab === 'sent' && 'Enviadas'}
                    {tab === 'replied' && 'Respostas'}
                    <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                      {tab === 'pending' && data.filter(d => d.campaignStatus === CampaignStatus.PENDING && d.telefone).length}
                      {tab === 'sent' && data.filter(d => d.campaignStatus === CampaignStatus.SENT).length}
                      {tab === 'replied' && data.filter(d => d.campaignStatus === CampaignStatus.REPLIED).length}
                    </span>
                  </button>
                ))}
              </div>

              {activeTab === 'pending' && selectedIds.size > 0 && (
                <button className="btn-primary animate-slide-up">
                  <Send size={18} />
                  <span>Disparar ({selectedIds.size})</span>
                </button>
              )}
           </div>

           {/* Filters */}
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <Filter size={20} className="text-slate-400" />
              <div className="flex-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Filtrar por Motivo</label>
                 <select 
                   className="w-full mt-1 bg-transparent font-semibold text-slate-800 outline-none"
                   value={motivoFilter}
                   onChange={(e) => setMotivoFilter(e.target.value)}
                 >
                    <option value="all">Todos os Motivos</option>
                    {availableMotivos.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                 </select>
              </div>
           </div>
        </div>

        {/* Message Config */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
           <div className="flex justify-between items-center mb-2">
             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
               <MessageSquare size={14} />
               Mensagem Inicial
             </label>
             <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">Variáveis: {'{Empresa}'}, {'{Motivo}'}</span>
           </div>
           <textarea 
             className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:bg-white focus:border-blue-500 transition-colors"
             value={initialMessage}
             onChange={(e) => setInitialMessage(e.target.value)}
             placeholder="Digite a mensagem inicial..."
           />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {activeTab === 'pending' && (
                  <th className="p-5 border-b border-slate-200 w-16 text-center">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                )}
                <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</th>
                <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {activeTab === 'pending' ? 'Motivo da Inaptidão' : 'Última Interação'}
                </th>
                <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Status IA</th>
                <th className="p-5 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {activeTab === 'pending' && (
                    <td className="p-5 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelection(row.id)}
                      />
                    </td>
                  )}
                  <td className="p-5">
                    <div className="font-bold text-slate-800">{row.razaoSocial}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 font-medium">{row.cnpj}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                          <Smartphone size={16} />
                       </div>
                       <span className="text-sm font-bold text-slate-700">{row.telefone}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    {activeTab === 'pending' ? (
                      <span className="inline-block max-w-xs truncate text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200" title={row.motivoSituacao}>
                        {row.motivoSituacao || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-600">{row.lastContacted ? new Date(row.lastContacted).toLocaleString() : '-'}</span>
                    )}
                  </td>
                   <td className="p-5">
                      {hasRule(row.motivoSituacao) ? (
                         <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit border border-emerald-100 shadow-sm">
                           <Bot size={14} /> Pronta
                         </div>
                      ) : (
                         <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit border border-amber-100 shadow-sm">
                           <AlertTriangle size={14} /> Requer Treino
                         </div>
                      )}
                  </td>
                  <td className="p-5">
                    <button className="p-2 h-auto rounded-lg px-2 text-slate-500 hover:bg-slate-100 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- WhatsApp View ---

const WhatsAppView = ({ session, setSession, aiConfig, setAiConfig }: { 
  session: WhatsAppSession, 
  setSession: React.Dispatch<React.SetStateAction<WhatsAppSession>>,
  aiConfig: AIConfig,
  setAiConfig: React.Dispatch<React.SetStateAction<AIConfig>>
}) => {
  const [logs, setLogs] = useState<string[]>([
    "> System.init(Baileys_Protocol)",
    "> Waiting for QR Code generation..."
  ]);
  const [qrKey, setQrKey] = useState(0); 

  useEffect(() => {
    if (session.status === 'disconnected') {
      setTimeout(() => {
        setSession(prev => ({ 
          ...prev, 
          status: 'qr_ready', 
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=ffffff&color=000000&margin=10&data=BaileysConnection_${Date.now()}` 
        }));
        setLogs(prev => [...prev, "> QR Code generated successfully.", "> Status: WAITING_SCAN"]);
      }, 1000);
    }
  }, [session.status, setSession, qrKey]);

  const refreshQR = () => {
    setSession(prev => ({ ...prev, status: 'disconnected', qrCode: undefined }));
    setQrKey(prev => prev + 1);
    setLogs(prev => [...prev, "> Refreshing session...", "> Generating new handshake..."]);
  };

  const handleConnect = () => {
    setSession(prev => ({ ...prev, status: 'connecting' }));
    setLogs(prev => [...prev, "> Device detected.", "> Handshaking...", "> Decrypting keys..."]);
    setTimeout(() => {
      setSession({ status: 'connected', userName: 'Lucas Contabilidade', phoneNumber: '5571999999999' });
      setLogs(prev => [...prev, "> Connection Established.", "> Session: ACTIVE - Lucas Contabilidade"]);
    }, 2000);
  };

  const handleDisconnect = () => {
    setSession({ status: 'disconnected' });
    setLogs(prev => [...prev, "> Disconnected by user.", "> Session terminated."]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        
        <div className="mb-8 relative z-10">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ease-out border-4 ${
            session.status === 'connected' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-50 text-slate-300 border-slate-100'
          }`}>
            <Smartphone size={64} strokeWidth={1.5} />
          </div>
          <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-colors duration-500 ${
             session.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'
          }`}>
             {session.status === 'connected' && <Check size={18} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
          {session.status === 'connected' ? 'Dispositivo Pareado' : 'Conectar WhatsApp'}
        </h2>
        <p className="text-slate-500 mb-6 px-4 font-medium">
          {session.status === 'connected' 
            ? `Sessão ativa com ${session.userName}.` 
            : 'Escaneie o QR Code para sincronizar.'}
        </p>

        {session.status === 'connected' && (
           <div className="mb-8 w-full">
              <button
                onClick={() => setAiConfig(prev => ({...prev, aiActive: !prev.aiActive}))}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  aiConfig.aiActive 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${aiConfig.aiActive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Bot size={20} />
                   </div>
                   <div className="text-left">
                      <div className="font-bold text-sm">Inteligência Artificial</div>
                      <div className="text-xs opacity-80">{aiConfig.aiActive ? 'Respondendo automaticamente' : 'Desativada'}</div>
                   </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${aiConfig.aiActive ? 'bg-blue-500' : 'bg-slate-300'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${aiConfig.aiActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </button>
           </div>
        )}

        {session.status === 'qr_ready' && (
          <div className="mb-6 flex flex-col items-center w-full relative z-10">
            <div 
              className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-105 group relative overflow-hidden" 
              onClick={handleConnect}
            >
              <div className="relative z-10">
                {session.qrCode ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={session.qrCode} alt="QR Code" className="w-64 h-64 rounded-xl" style={{imageRendering: 'pixelated'}} />
                ) : (
                  <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-xl"></div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-xl transition-all duration-300 backdrop-blur-[2px]">
                   <Smartphone size={32} className="text-white mb-2" />
                   <span className="text-white font-bold text-sm">Simular Leitura</span>
                </div>
              </div>
            </div>
             <button 
              onClick={refreshQR}
              className="mt-6 flex items-center space-x-2 text-slate-400 hover:text-blue-600 text-sm font-bold transition-colors py-2 px-4 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={14} />
              <span>Gerar Novo Código</span>
            </button>
          </div>
        )}

        {session.status === 'connected' ? (
          <button 
            onClick={handleDisconnect}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 w-full"
          >
            <LogOut size={18} />
            Desconectar Sessão
          </button>
        ) : (
          session.status !== 'qr_ready' && (
            <div className="flex flex-col items-center gap-4 text-slate-400 mt-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="font-bold text-slate-600">Conectando...</span>
            </div>
          )
        )}
      </div>

      <div className="lg:col-span-2 bg-[#0B1120] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
        <div className="bg-[#151e32] px-6 py-5 flex justify-between items-center border-b border-slate-700/50">
          <h3 className="text-slate-200 font-mono font-bold flex items-center gap-3">
            <div className="p-1.5 bg-slate-800 rounded-lg">
               <Terminal size={16} className="text-blue-400" />
            </div>
            Baileys Console_
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-700">v5.3.1</span>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-8 font-mono text-sm overflow-auto custom-scrollbar bg-[#0B1120]">
          {logs.map((log, i) => (
            <div key={i} className="mb-4 flex gap-4 hover:bg-white/5 p-2 -mx-2 rounded transition-colors group">
              <span className="text-slate-600 select-none w-8 text-right font-bold group-hover:text-slate-500">{(i + 1)}</span>
              <span className="text-slate-600 select-none border-r border-slate-800 pr-4 mr-1">[{new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('Error') ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {log}
              </span>
            </div>
          ))}
          <div className="animate-pulse text-blue-500 mt-2 font-bold flex items-center gap-2">
            <span>_</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Knowledge Base View (Refined) ---

const KnowledgeBaseView = ({ 
  config, 
  setConfig,
  companies 
}: { 
  config: AIConfig, 
  setConfig: React.Dispatch<React.SetStateAction<AIConfig>>,
  companies: CompanyResult[]
}) => {
  const availableMotivos = useMemo(() => {
    const motivos = new Set(companies.map(c => c.motivoSituacao).filter(m => m && m !== ''));
    return Array.from(motivos).sort();
  }, [companies]);

  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(availableMotivos[0] || null);
  const [generatedPreview, setGeneratedPreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeRule = useMemo(() => {
    if (!selectedMotivo) return null;
    return config.knowledgeRules.find(r => r.motivoSituacao === selectedMotivo) || {
      id: `temp-${Date.now()}`,
      motivoSituacao: selectedMotivo,
      diagnosis: '',
      solution: '',
      salesPitch: '',
      isActive: false
    };
  }, [config.knowledgeRules, selectedMotivo]);

  const handleSaveRule = (updatedRule: KnowledgeRule) => {
    const exists = config.knowledgeRules.find(r => r.motivoSituacao === updatedRule.motivoSituacao);
    let newRules;
    if (exists) {
      newRules = config.knowledgeRules.map(r => r.motivoSituacao === updatedRule.motivoSituacao ? { ...updatedRule, isActive: true } : r);
    } else {
      newRules = [...config.knowledgeRules, { ...updatedRule, id: Date.now().toString(), isActive: true }];
    }
    setConfig(prev => ({ ...prev, knowledgeRules: newRules }));
  };

  const generatePreview = () => {
    if (!activeRule || !selectedMotivo) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      let response = "";
      const companyExample = companies.find(c => c.motivoSituacao === selectedMotivo);
      const name = companyExample?.razaoSocial || "[Nome da Empresa]";

      if (activeRule.isActive) {
        response = `Olá, falo com o responsável pela ${name}? Aqui é Lucas.\n\n` + 
                   `Notei que a empresa está Inapta na SEFAZ devido a: "${selectedMotivo}".\n\n` +
                   `O que isso significa: ${activeRule.diagnosis}\n\n` +
                   `Como resolvemos: ${activeRule.solution}\n\n` +
                   `${activeRule.salesPitch}\n\n` +
                   `Podemos agendar uma conversa rápida para regularizar isso?`;
      } else {
        response = `[ERRO: Nenhuma estratégia definida para "${selectedMotivo}". A IA não saberá o que dizer.]`;
      }

      setGeneratedPreview(response);
      setIsGenerating(false);
    }, 600);
  };

  useEffect(() => {
    if (selectedMotivo) generatePreview();
  }, [selectedMotivo, activeRule]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Sidebar List */}
      <div className="w-full lg:w-80 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            Biblioteca
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">{availableMotivos.length} cenários identificados</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50/50">
          {availableMotivos.map(motivo => {
            const hasConfig = config.knowledgeRules.some(r => r.motivoSituacao === motivo && r.isActive);
            const isSelected = selectedMotivo === motivo;
            return (
              <div 
                key={motivo}
                onClick={() => setSelectedMotivo(motivo)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 relative group border ${
                  isSelected 
                    ? 'bg-white border-blue-200 shadow-lg shadow-blue-500/10' 
                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold leading-tight line-clamp-2 ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                    {motivo}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                   <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                     {companies.filter(c => c.motivoSituacao === motivo).length} casos
                   </div>
                   {hasConfig ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Simulator */}
      <div className="flex-1 flex flex-col gap-8 overflow-hidden">
        {selectedMotivo && activeRule ? (
          <div className="flex flex-col lg:flex-row h-full gap-8">
             {/* Editor Column */}
             <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                   <div>
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Regra de Negócio</span>
                      <h3 className="font-bold text-slate-900 text-lg truncate max-w-md mt-1" title={selectedMotivo}>{selectedMotivo}</h3>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Diagnóstico (O que é?)</label>
                    <p className="text-xs text-slate-400 mb-2">Explique o problema de forma que a IA entenda o contexto técnico.</p>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm min-h-[100px]"
                      placeholder="Ex: O contribuinte excedeu o limite de compras do MEI em mais de 20%..."
                      value={activeRule.diagnosis}
                      onChange={(e) => handleSaveRule({...activeRule, diagnosis: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Solução Técnica (O que faremos?)</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm min-h-[100px]"
                      placeholder="Ex: Desenquadramento obrigatório e migração para Simples Nacional..."
                      value={activeRule.solution}
                      onChange={(e) => handleSaveRule({...activeRule, solution: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Argumento de Venda (Pitch)</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm min-h-[100px]"
                      placeholder="Ex: Se não regularizar, a dívida aumenta. Eu resolvo isso rápido..."
                      value={activeRule.salesPitch}
                      onChange={(e) => handleSaveRule({...activeRule, salesPitch: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                   <button 
                    onClick={() => handleSaveRule(activeRule)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
                   >
                     <Save size={18} />
                     Salvar Regra
                   </button>
                </div>
             </div>

             {/* Simulator Column */}
             <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <h3 className="font-bold flex items-center gap-2">
                    <Bot size={20} />
                    Simulador IA
                  </h3>
                  <p className="text-xs text-blue-100 mt-1 opacity-80">Pré-visualização da mensagem gerada</p>
                </div>

                <div className="flex-1 bg-slate-50 p-6 flex flex-col">
                   <div className="bg-white rounded-2xl rounded-tl-none p-5 shadow-sm border border-slate-200 text-sm leading-relaxed text-slate-600 flex-1 relative">
                      {isGenerating ? (
                        <div className="flex items-center gap-3 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin" />
                          <span>Gerando...</span>
                        </div>
                      ) : (
                        generatedPreview ? (
                          <div className="whitespace-pre-wrap">{generatedPreview}</div>
                        ) : (
                          <div className="text-center text-slate-400 mt-10">
                            Configure a regra e clique em testar para ver o resultado.
                          </div>
                        )
                      )}
                   </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                   <button 
                    onClick={generatePreview}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                   >
                     <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                     Testar Resposta
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <BookOpen size={64} className="mb-4 opacity-20" />
             <p>Selecione um motivo ao lado para começar o treinamento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'upload' | 'results' | 'campaign' | 'whatsapp' | 'knowledge' | 'settings'>('dashboard');
  
  // Persistent Data with useLocalStorage
  const [companies, setCompanies] = useLocalStorage<CompanyResult[]>('crm_companies', MOCK_DATA);
  const [whatsappSession, setWhatsappSession] = useLocalStorage<WhatsAppSession>('crm_whatsapp', { status: 'disconnected' });
  const [aiConfig, setAiConfig] = useLocalStorage<AIConfig>('crm_ai_config', {
    model: 'gpt-4',
    persona: DEFAULT_AI_PERSONA,
    knowledgeRules: DEFAULT_KNOWLEDGE_RULES,
    temperature: 0.7,
    aiActive: false
  });

  const handleUpload = () => {
    // Simulate adding new data from upload
    const newCompanies = [...companies]; 
    // In a real app, this would parse the PDF
    setCompanies(newCompanies);
    setActiveView('results');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0B1120] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 z-50">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 text-white mb-1">
             <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
               <Bot size={24} strokeWidth={2} />
             </div>
             <div>
               <h1 className="text-xl font-black tracking-tight">CRM VIRGULA</h1>
               <div className="text-[10px] font-bold text-blue-400 tracking-widest uppercase mt-0.5">Automação SEFAZ</div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
          <div className="px-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Visão Geral</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          
          <div className="px-6 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Aquisição</div>
          <SidebarItem icon={Upload} label="Importar Dados" active={activeView === 'upload'} onClick={() => setActiveView('upload')} />
          <SidebarItem icon={Briefcase} label="Base de Empresas" active={activeView === 'results'} onClick={() => setActiveView('results')} />
          
          <div className="px-6 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendas</div>
          <SidebarItem icon={Megaphone} label="Gestão de Campanhas" active={activeView === 'campaign'} onClick={() => setActiveView('campaign')} />
          <SidebarItem icon={MessageCircle} label="Conexão WhatsApp" active={activeView === 'whatsapp'} onClick={() => setActiveView('whatsapp')} />
          
          <div className="px-6 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Inteligência</div>
          <SidebarItem icon={BookOpen} label="Treinamento IA" active={activeView === 'knowledge'} onClick={() => setActiveView('knowledge')} />
          <SidebarItem icon={Settings} label="Configurações" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#0f1629]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${whatsappSession.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`}></div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bot Status</div>
                <div className="text-sm font-bold text-white">{whatsappSession.status === 'connected' ? 'Online' : 'Offline'}</div>
              </div>
            </div>
            {whatsappSession.status === 'connected' && (
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${aiConfig.aiActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                title={aiConfig.aiActive ? "IA Ativa" : "IA Desativada"}
              >
                <Bot size={16} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeView === 'dashboard' && 'Dashboard Geral'}
              {activeView === 'upload' && 'Importação de Dados'}
              {activeView === 'results' && 'Base de Empresas'}
              {activeView === 'campaign' && 'Gestão de Campanhas'}
              {activeView === 'whatsapp' && 'Conexão WhatsApp'}
              {activeView === 'knowledge' && 'Base de Conhecimento IA'}
              {activeView === 'settings' && 'Configurações do Sistema'}
            </h2>
            <p className="text-xs font-medium text-slate-400 flex items-center gap-2 mt-0.5">
              <Clock size={12} />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800">Lucas Araújo</div>
                <div className="text-xs text-slate-500 font-medium">Administrador</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-900/20 cursor-pointer hover:scale-105 transition-transform">
                LC
              </div>
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50 relative">
           {activeView === 'dashboard' && <DashboardView data={companies} />}
           {activeView === 'upload' && <UploadView onUpload={handleUpload} />}
           {activeView === 'results' && <ResultsView data={companies} />}
           {activeView === 'campaign' && <CampaignView data={companies} config={aiConfig} />}
           {activeView === 'whatsapp' && <WhatsAppView session={whatsappSession} setSession={setWhatsappSession} aiConfig={aiConfig} setAiConfig={setAiConfig} />}
           {activeView === 'knowledge' && <KnowledgeBaseView config={aiConfig} setConfig={setAiConfig} companies={companies} />}
           {activeView === 'settings' && (
             <div className="flex items-center justify-center h-full text-slate-400">
               <div className="text-center">
                 <Settings size={48} className="mx-auto mb-4 opacity-20" />
                 <p>Configurações gerais do sistema em breve.</p>
               </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default App;