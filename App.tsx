
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Database, 
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
  PlayCircle,
  Save,
  Megaphone,
  BookOpen,
  Clock,
  Check,
  MessageSquare,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Users,
  Terminal,
  ChevronRight
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
import { CompanyResult, Status, WhatsAppSession, AIConfig, CampaignStatus, KnowledgeRule } from './types';
import { MOCK_DATA, DEFAULT_AI_PERSONA, DEFAULT_KNOWLEDGE_RULES } from './constants';

// --- UI Components ---

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
    className={`w-full flex items-center space-x-3 px-4 py-3 mx-2 mb-1 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trendValue}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
  </div>
);

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
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Empresas Importadas" value={stats.total} icon={Database} color="bg-blue-500" trend="up" trendValue="+12%" />
        <StatCard title="Contatos Válidos" value={stats.withPhone} icon={Smartphone} color="bg-emerald-500" trend="up" trendValue="+5%" />
        <StatCard title="Msgs Enviadas" value={stats.campaignSent} icon={Send} color="bg-brand-600" trend="up" trendValue="+24%" />
        <StatCard title="Taxa de Resposta" value="15%" icon={MessageSquare} color="bg-violet-500" trend="down" trendValue="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Performance da Campanha</h3>
            <button className="text-sm text-brand-600 font-medium hover:underline">Ver detalhes</button>
          </div>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statusData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Qualidade da Base</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F1F5F9'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{Math.round((stats.withPhone / stats.total) * 100)}%</span>
              <span className="text-xs text-slate-500 font-medium uppercase">Contatáveis</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-600">Com Telefone</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                <span className="text-sm text-slate-600">Sem Contato</span>
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
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center animate-slide-up pb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Importar Dados da SEFAZ</h2>
        <p className="text-slate-500 mt-2">Carregue o PDF oficial para alimentar sua base de leads.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

        <div 
          className={`relative z-10 border-4 border-dashed rounded-2xl p-16 transition-all duration-300 ${
            isDragging 
              ? 'border-brand-500 bg-brand-50/50 scale-[1.02]' 
              : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { 
            e.preventDefault(); 
            setIsDragging(false); 
            handleSimulatedUpload();
          }}
        >
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            {isProcessing ? <Loader2 className="animate-spin" size={40} /> : <Upload size={40} />}
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {isProcessing ? 'Processando Arquivo...' : 'Arraste e solte seu PDF'}
          </h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Suportamos arquivos PDF gerados diretamente pelo portal da SEFAZ. O sistema extrai automaticamente I.E., Razão Social e Motivos.
          </p>
          
          {!isProcessing && (
            <button 
              onClick={handleSimulatedUpload}
              className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all hover:scale-105 shadow-lg shadow-brand-500/30"
            >
              Selecionar do Computador
            </button>
          )}

          {isProcessing && (
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-700">Extraindo dados...</span>
                <span className="text-brand-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-brand-600 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] border-t border-b border-transparent" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
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
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="relative w-96 group">
          <input
            type="text"
            placeholder="Buscar empresa, CNPJ ou IE..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 font-semibold transition-colors">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm hover:bg-emerald-100 font-bold transition-colors">
            <FileSpreadsheet size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50/50">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-5 border-b border-slate-100 w-16 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th className="p-5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
              <th className="p-5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos</th>
              <th className="p-5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</th>
              <th className="p-5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Status SEFAZ</th>
              <th className="p-5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredData.map((row) => (
              <tr key={row.id} className={`table-row-hover group cursor-pointer ${selectedIds.has(row.id) ? 'bg-brand-50/30' : ''}`}>
                <td className="p-5 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelection(row.id)}
                  />
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {row.razaoSocial.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{row.razaoSocial}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Users size={10} />
                        {row.nomeContador || 'Sem contador'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                   <div className="space-y-1">
                     <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono border border-slate-200">
                       {row.cnpj}
                     </span>
                     <div className="text-xs text-slate-500 pl-1">IE: {row.inscricaoEstadual}</div>
                   </div>
                </td>
                <td className="p-5 text-sm font-medium text-slate-600">{row.municipio}</td>
                <td className="p-5">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      row.situacaoCadastral === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' :
                      row.situacaoCadastral === 'INAPTA' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        row.situacaoCadastral === 'ATIVA' ? 'bg-emerald-500' :
                        row.situacaoCadastral === 'INAPTA' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }`}></span>
                      {row.situacaoCadastral}
                    </span>
                    {row.motivoSituacao && (
                      <span className="text-[10px] leading-tight text-slate-400 max-w-[140px] truncate" title={row.motivoSituacao}>
                        {row.motivoSituacao}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-5">
                  {row.telefone ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="p-1.5 bg-green-100 text-green-700 rounded-full">
                        <Smartphone size={14} />
                      </div>
                      <span className="text-sm font-medium">{row.telefone}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs italic">Sem número</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="p-20 text-center text-slate-400 flex flex-col items-center">
                  <Search size={48} className="text-slate-200 mb-4" />
                  <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
                  <p className="text-sm">Tente ajustar seus filtros de busca</p>
                </td>
              </tr>
            )}
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

  const filteredData = useMemo(() => {
    switch(activeTab) {
      case 'pending': 
        return data.filter(d => d.campaignStatus === CampaignStatus.PENDING && d.telefone);
      case 'sent':
        return data.filter(d => d.campaignStatus === CampaignStatus.SENT || d.campaignStatus === CampaignStatus.QUEUED);
      case 'replied':
        return data.filter(d => d.campaignStatus === CampaignStatus.REPLIED);
      default: return [];
    }
  }, [data, activeTab]);

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
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['pending', 'sent', 'replied'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-brand-600 text-white shadow-md transform scale-105' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab === 'pending' && 'Pendentes'}
              {tab === 'sent' && 'Enviadas'}
              {tab === 'replied' && 'Respondidas'}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
                {tab === 'pending' && data.filter(d => d.campaignStatus === CampaignStatus.PENDING && d.telefone).length}
                {tab === 'sent' && data.filter(d => d.campaignStatus === CampaignStatus.SENT).length}
                {tab === 'replied' && data.filter(d => d.campaignStatus === CampaignStatus.REPLIED).length}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'pending' && selectedIds.size > 0 && (
          <button className="flex items-center space-x-2 px-6 py-3 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30 animate-slide-up">
            <Send size={18} />
            <span>Disparar Campanha ({selectedIds.size})</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {activeTab === 'pending' && (
                  <th className="p-5 border-b border-slate-200 w-16 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
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
                <tr key={row.id} className="table-row-hover">
                  {activeTab === 'pending' && (
                    <td className="p-5 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelection(row.id)}
                      />
                    </td>
                  )}
                  <td className="p-5">
                    <div className="font-bold text-slate-800">{row.razaoSocial}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{row.cnpj}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                       <Smartphone size={14} className="text-slate-400" />
                       <span className="text-sm font-medium text-slate-600">{row.telefone}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    {activeTab === 'pending' ? (
                      <span className="inline-block max-w-xs truncate text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded" title={row.motivoSituacao}>
                        {row.motivoSituacao || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">{row.lastContacted ? new Date(row.lastContacted).toLocaleString() : '-'}</span>
                    )}
                  </td>
                   <td className="p-5">
                      {hasRule(row.motivoSituacao) ? (
                         <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold w-fit border border-emerald-100">
                           <Bot size={12} /> Pronta
                         </div>
                      ) : (
                         <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold w-fit border border-amber-100">
                           <AlertTriangle size={12} /> Treinar IA
                         </div>
                      )}
                  </td>
                  <td className="p-5">
                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                         <Search size={32} />
                      </div>
                      <p>Nenhuma empresa encontrada nesta lista.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- WhatsApp View ---

const WhatsAppView = ({ session, setSession }: { session: WhatsAppSession, setSession: React.Dispatch<React.SetStateAction<WhatsAppSession>> }) => {
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
      <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
        
        <div className="mb-8 relative">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
            session.status === 'connected' ? 'bg-green-100 text-green-600 scale-110 shadow-xl shadow-green-200' : 'bg-slate-100 text-slate-300'
          }`}>
            <Smartphone size={56} />
          </div>
          <div className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
             session.status === 'connected' ? 'bg-green-500' : 'bg-slate-400'
          }`}>
             {session.status === 'connected' && <Check size={14} className="text-white" />}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {session.status === 'connected' ? 'Dispositivo Pareado' : 'Conectar WhatsApp'}
        </h2>
        <p className="text-slate-500 mb-8 px-4">
          {session.status === 'connected' 
            ? `Sessão ativa com ${session.userName}. O bot está pronto para enviar mensagens.` 
            : 'Escaneie o QR Code abaixo para sincronizar sua conta.'}
        </p>

        {session.status === 'qr_ready' && (
          <div className="mb-6 flex flex-col items-center w-full">
            <div 
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group" 
              onClick={handleConnect}
            >
              <div className="relative">
                {session.qrCode ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={session.qrCode} alt="QR Code" className="w-60 h-60 rounded-xl" style={{imageRendering: 'pixelated'}} />
                ) : (
                  <div className="w-60 h-60 bg-slate-100 animate-pulse rounded-xl"></div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity text-white font-bold backdrop-blur-sm">
                   Simular Leitura
                </div>
              </div>
            </div>
             <button 
              onClick={refreshQR}
              className="mt-6 flex items-center space-x-2 text-slate-500 hover:text-brand-600 text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              <span>Gerar Novo Código</span>
            </button>
          </div>
        )}

        {session.status === 'connected' ? (
          <button 
            onClick={handleDisconnect}
            className="w-full py-4 border-2 border-red-100 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-200 font-bold transition-all"
          >
            Desconectar Sessão
          </button>
        ) : (
          session.status !== 'qr_ready' && (
            <div className="flex flex-col items-center gap-4 text-slate-400 mt-4">
              <Loader2 className="animate-spin text-brand-500" size={32} />
              <span className="font-medium">Iniciando protocolo de conexão...</span>
            </div>
          )
        )}
      </div>

      <div className="lg:col-span-2 bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
        <div className="bg-[#1E293B] px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <h3 className="text-slate-200 font-mono font-bold flex items-center gap-3">
            <Terminal size={18} className="text-brand-400" />
            Baileys Console_
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 font-mono text-sm overflow-auto custom-scrollbar bg-[#0F172A]">
          {logs.map((log, i) => (
            <div key={i} className="mb-3 flex gap-4 hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-slate-500 select-none">{(i + 1).toString().padStart(3, '0')}</span>
              <span className="text-slate-600 select-none">[{new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('Error') ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {log}
              </span>
            </div>
          ))}
          <div className="animate-pulse text-brand-500 mt-2 font-bold">_</div>
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
    setConfig({ ...config, knowledgeRules: newRules });
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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in">
      {/* Sidebar List */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" />
            Biblioteca de Motivos
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">{availableMotivos.length} cenários identificados</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          {availableMotivos.map(motivo => {
            const hasConfig = config.knowledgeRules.some(r => r.motivoSituacao === motivo && r.isActive);
            return (
              <div 
                key={motivo}
                onClick={() => setSelectedMotivo(motivo)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 relative group ${
                  selectedMotivo === motivo ? 'bg-white z-10 shadow-md border-transparent my-1 mx-2 rounded-xl' : 'hover:bg-white hover:pl-5'
                }`}
              >
                {selectedMotivo === motivo && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-r-full"></div>
                )}
                <div className="flex justify-between items-start mb-1.5 pl-2">
                  <span className={`text-sm font-bold leading-tight ${selectedMotivo === motivo ? 'text-brand-800' : 'text-slate-700'}`}>
                    {motivo}
                  </span>
                </div>
                <div className="flex items-center justify-between pl-2">
                   <div className="text-xs text-slate-400 font-medium">
                     {companies.filter(c => c.motivoSituacao === motivo).length} afetados
                   </div>
                   {hasConfig ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Check size={10} /> Configurado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock size={10} /> Pendente
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Simulator */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedMotivo && activeRule ? (
          <div className="flex flex-col lg:flex-row h-full gap-6">
             {/* Editor Column */}
             <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                   <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editando Regra</span>
                      <h3 className="font-bold text-slate-800 text-lg truncate max-w-md" title={selectedMotivo}>{selectedMotivo}</h3>
                   </div>
                   <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${activeRule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                     {activeRule.isActive ? 'Ativo' : 'Rascunho'}
                   </span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <AlertCircle size={16} className="text-amber-500"/>
                      Diagnóstico (Explicação Simples)
                    </label>
                    <textarea 
                      className="glass-input w-full p-4 rounded-xl text-sm min-h-[100px] outline-none"
                      placeholder="Explique o problema para o cliente..."
                      value={activeRule.diagnosis}
                      onChange={(e) => handleSaveRule({...activeRule, diagnosis: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <CheckCircle2 size={16} className="text-emerald-500"/>
                      Solução Técnica
                    </label>
                    <textarea 
                      className="glass-input w-full p-4 rounded-xl text-sm min-h-[100px] outline-none"
                      placeholder="Qual o serviço técnico necessário?"
                      value={activeRule.solution}
                      onChange={(e) => handleSaveRule({...activeRule, solution: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Lightbulb size={16} className="text-brand-500"/>
                      Pitch de Venda (Argumentação)
                    </label>
                    <textarea 
                      className="glass-input w-full p-4 rounded-xl text-sm min-h-[120px] outline-none"
                      placeholder="Como convencer o cliente a fechar agora?"
                      value={activeRule.salesPitch}
                      onChange={(e) => handleSaveRule({...activeRule, salesPitch: e.target.value})}
                    />
                  </div>
                </div>
             </div>

             {/* Simulator Column */}
             <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
               <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 flex flex-col overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <h4 className="text-slate-200 font-bold text-sm flex items-center gap-2">
                      <Bot size={16} className="text-brand-400"/> IA Preview
                    </h4>
                    {isGenerating && <Loader2 className="animate-spin text-brand-500" size={14} />}
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto bg-slate-900 custom-scrollbar">
                    {activeRule.isActive ? (
                       <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/50 text-white">
                          <Bot size={16} />
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="bg-slate-800 text-slate-200 text-sm p-3 rounded-2xl rounded-tl-none leading-relaxed border border-slate-700 shadow-sm">
                             {generatedPreview.split('\n').map((line, i) => (
                               <React.Fragment key={i}>
                                 {line}
                                 {i < generatedPreview.split('\n').length - 1 && <br />}
                               </React.Fragment>
                             ))}
                           </div>
                           <span className="text-[10px] text-slate-500 ml-1">Agora mesmo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
                        <Edit2 className="text-slate-600 mb-2" size={32} />
                        <p className="text-slate-500 text-xs">Preencha os campos ao lado para gerar uma simulação.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <button 
                      onClick={generatePreview}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={12} /> Regenerar Resposta
                    </button>
                  </div>
               </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
             <div className="text-center max-w-sm p-8 rounded-3xl border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ArrowRight size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-700">Comece por aqui</h3>
               <p className="text-slate-500 text-sm mt-2">Selecione um motivo na lista à esquerda para ensinar a IA como lidar com essa situação.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Settings View ---

const AIConfigView = ({ 
  config, 
  setConfig 
}: { 
  config: AIConfig, 
  setConfig: React.Dispatch<React.SetStateAction<AIConfig>> 
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
       {/* Model Settings */}
       <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <Bot size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Motor de Inteligência</h3>
              <p className="text-sm text-slate-500">Ajuste como o Gemini processa as informações.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Modelo LLM</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none appearance-none font-medium text-slate-700"
                  value={config.model}
                  onChange={(e) => setConfig({...config, model: e.target.value})}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                  <option value="gemini-3-pro">Gemini 3 Pro (Maior Custo)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronRight className="rotate-90" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-bold text-slate-700">Criatividade (Temperatura)</label>
                <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 rounded">{config.temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                value={config.temperature}
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
              />
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Preciso (0.0)</span>
                <span>Criativo (1.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persona Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                <Users size={28} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900">Persona do Vendedor</h3>
                <p className="text-sm text-slate-500">Instruções de sistema para moldar a personalidade da IA.</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-400 transition-all">
            <textarea 
              className="w-full h-64 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm text-slate-700 leading-relaxed"
              value={config.persona}
              onChange={(e) => setConfig({...config, persona: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
           <button className="px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20 flex items-center gap-3 transition-transform hover:-translate-y-1">
             <Save size={20} />
             Salvar Configurações
           </button>
        </div>
    </div>
  );
};

// --- Main App Layout ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyResult[]>(MOCK_DATA);
  const [whatsAppSession, setWhatsAppSession] = useState<WhatsAppSession>({ status: 'disconnected' });
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gemini-2.5-flash',
    persona: DEFAULT_AI_PERSONA,
    knowledgeRules: DEFAULT_KNOWLEDGE_RULES,
    temperature: 0.7
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView data={companies} />;
      case 'import':
        return <UploadView onUpload={() => {
           const newCompany = { 
             ...MOCK_DATA[0], 
             id: Date.now().toString(), 
             razaoSocial: 'NOVA EMPRESA IMPORTADA LTDA',
             motivoSituacao: 'Novo Motivo Desconhecido SEFAZ',
             campaignStatus: CampaignStatus.PENDING 
            };
           setCompanies([...companies, newCompany]);
           setActiveTab('empresas');
        }} />;
      case 'empresas':
        return <ResultsView data={companies} />;
      case 'campaigns':
        return <CampaignView data={companies} config={aiConfig} />;
      case 'whatsapp':
        return <WhatsAppView session={whatsAppSession} setSession={setWhatsAppSession} />;
      case 'knowledge':
        return <KnowledgeBaseView config={aiConfig} setConfig={setAiConfig} companies={companies} />;
      case 'settings':
        return <AIConfigView config={aiConfig} setConfig={setAiConfig} />;
      default:
        return <DashboardView data={companies} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#0F172A] border-r border-slate-800 h-full shrink-0 z-30 transition-all duration-300">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-600/20">
             <Bot className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">CRM</h1>
            <span className="text-xs text-brand-400 font-bold uppercase tracking-[0.2em]">VIRGULA</span>
          </div>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar px-2">
          <SidebarItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          
          <div className="px-6 py-4 mt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Aquisição</p>
          </div>
          <SidebarItem icon={Upload} label="Importar Dados" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
          <SidebarItem icon={Briefcase} label="Base de Empresas" active={activeTab === 'empresas'} onClick={() => setActiveTab('empresas')} />
          
          <div className="px-6 py-4 mt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Vendas</p>
          </div>
          <SidebarItem icon={Megaphone} label="Campanhas" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
          <SidebarItem icon={MessageCircle} label="Conexão WhatsApp" active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} />
          
          <div className="px-6 py-4 mt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Inteligência</p>
          </div>
          <SidebarItem icon={BookOpen} label="Treinamento IA" active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')} />
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${whatsAppSession.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                {whatsAppSession.status === 'connected' && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>}
              </div>
              <span className="text-sm font-bold text-slate-300">Status do Bot</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {whatsAppSession.status === 'connected' ? 'Sistema operando normalmente.' : 'Desconectado. Aguardando QR.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F8FAFC]">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg">
               <Bot className="text-white" size={20} />
            </div>
            <span className="font-bold text-slate-900">CRM VIRGULA</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-[65px] left-0 w-full bg-white border-b border-slate-200 z-30 shadow-xl h-screen overflow-y-auto pb-20 p-4">
             <nav className="space-y-1">
                {/* Simplified Mobile Nav */}
                <button className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-bold text-slate-700" onClick={() => {setActiveTab('dashboard'); setMobileMenuOpen(false)}}>Dashboard</button>
                <button className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-bold text-slate-700" onClick={() => {setActiveTab('campaigns'); setMobileMenuOpen(false)}}>Campanhas</button>
                <button className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-bold text-slate-700" onClick={() => {setActiveTab('whatsapp'); setMobileMenuOpen(false)}}>WhatsApp</button>
             </nav>
          </div>
        )}

        {/* Top Bar Area */}
        <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200/50 sticky top-0 z-10 backdrop-blur-md bg-white/80">
           <div>
              <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                {activeTab === 'settings' ? 'Configurações IA' : 
                 activeTab === 'whatsapp' ? 'Central de Conexão' : 
                 activeTab === 'knowledge' ? 'Base de Conhecimento' :
                 activeTab === 'campaigns' ? 'Gestão de Campanhas' :
                 activeTab === 'empresas' ? 'Base de Empresas' :
                 activeTab === 'import' ? 'Importação de Dados' :
                 'Dashboard Geral'}
              </h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
                <Clock size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
                LC
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto h-full pb-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
