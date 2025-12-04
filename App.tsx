
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
  Power,
  Trash2
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
  Cell
} from 'recharts';
import { CompanyResult, Status, CampaignStatus, KnowledgeRule, AIConfig, WhatsAppSession } from './types';
import { MOCK_DATA, DEFAULT_KNOWLEDGE_RULES, DEFAULT_AI_PERSONA } from './constants';

// --- Custom Hooks ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mb-1
      ${active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }
      ${collapsed ? 'justify-center px-2' : ''}
    `}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
    {!collapsed && <span>{label}</span>}
    {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="relative overflow-hidden bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] group hover:-translate-y-1 transition-all duration-300">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {trend && (
        <p className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
          <span className="text-emerald-500">↑</span> {trend} vs último mês
        </p>
      )}
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Persistent State
  const [companies, setCompanies] = useLocalStorage<CompanyResult[]>('crm_companies', MOCK_DATA);
  const [knowledgeRules, setKnowledgeRules] = useLocalStorage<KnowledgeRule[]>('crm_rules', DEFAULT_KNOWLEDGE_RULES);
  const [aiConfig, setAiConfig] = useLocalStorage<AIConfig>('crm_ai_config', {
    model: 'gemini-pro',
    persona: DEFAULT_AI_PERSONA,
    knowledgeRules: DEFAULT_KNOWLEDGE_RULES,
    temperature: 0.7,
    aiActive: false
  });
  const [initialMessage, setInitialMessage] = useLocalStorage<string>('crm_initial_msg', 'Olá, tudo bem?');

  // Temporary State
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(knowledgeRules[0]?.id || null);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [whatsappSession, setWhatsappSession] = useState<WhatsAppSession>({ status: 'disconnected' });
  
  // Campaign State
  const [campaignFilter, setCampaignFilter] = useState<CampaignStatus | 'all'>('all');
  const [campaignReasonFilter, setCampaignReasonFilter] = useState<string>('all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // --- Computed Data ---
  
  const stats = useMemo(() => {
    return {
      total: companies.length,
      success: companies.filter(c => c.status === Status.SUCCESS).length,
      pending: companies.filter(c => c.campaignStatus === CampaignStatus.PENDING).length,
      contacted: companies.filter(c => c.campaignStatus !== CampaignStatus.PENDING).length,
    };
  }, [companies]);

  const uniqueReasons = useMemo(() => {
    const reasons = new Set(companies.map(c => c.motivoSituacao));
    return Array.from(reasons);
  }, [companies]);

  // --- Actions ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          // In a real app, we would parse the PDF here. 
          // For now, let's just add a duplicate mock entry to simulate data
          const newEntry: CompanyResult = {
            ...MOCK_DATA[0],
            id: Math.random().toString(36).substr(2, 9),
            razaoSocial: `NOVA EMPRESA IMPORTADA ${Math.floor(Math.random() * 100)}`,
            status: Status.SUCCESS
          };
          setCompanies(prev => [newEntry, ...prev]);
          setActiveTab('empresas');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const toggleAiActive = () => {
    setAiConfig(prev => ({ ...prev, aiActive: !prev.aiActive }));
  };

  const handleSaveRule = (updatedRule: KnowledgeRule) => {
    setKnowledgeRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
    // Also update main config
    setAiConfig(prev => ({
      ...prev,
      knowledgeRules: prev.knowledgeRules.map(r => r.id === updatedRule.id ? updatedRule : r)
    }));
  };

  const getAiResponse = (inputReason: string) => {
    const rule = knowledgeRules.find(r => inputReason.includes(r.motivoSituacao)) || knowledgeRules[0];
    if (!rule) return "Não encontrei uma regra específica para este caso.";
    
    return `[IA simulando resposta para: ${rule.motivoSituacao}]\n\n` +
           `Olá! Vi que sua empresa está com a situação "${rule.diagnosis}".\n` +
           `${rule.salesPitch}\n\n` +
           `A solução técnica é: ${rule.solution}`;
  };

  const handleCampaignBlast = () => {
    if (selectedCompanies.length === 0) return;
    
    // Simulate sending
    const updatedCompanies = companies.map(c => {
      if (selectedCompanies.includes(c.id)) {
        return {
          ...c,
          campaignStatus: CampaignStatus.QUEUED,
          lastMessageSent: initialMessage
        };
      }
      return c;
    });
    
    setCompanies(updatedCompanies);
    setSelectedCompanies([]);
    alert(`Enviando mensagens para ${selectedCompanies.length} empresas!`);
  };

  // --- Views ---

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Geral</h1>
        <p className="text-slate-500">Visão geral da sua operação de regularização.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Empresas" 
          value={stats.total} 
          icon={Briefcase} 
          color="text-blue-600 bg-blue-600"
          trend="+12%"
        />
        <StatCard 
          title="Empresas Contatadas" 
          value={stats.contacted} 
          icon={Megaphone} 
          color="text-violet-600 bg-violet-600"
          trend="+5%"
        />
        <StatCard 
          title="Respostas (Leads)" 
          value={companies.filter(c => c.campaignStatus === CampaignStatus.REPLIED).length} 
          icon={MessageCircle} 
          color="text-emerald-600 bg-emerald-600"
          trend="+8%"
        />
        <StatCard 
          title="Taxa de Inaptidão" 
          value="84%" 
          icon={AlertTriangle} 
          color="text-rose-600 bg-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-premium p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Funil de Campanhas</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Pendentes', value: stats.pending },
                { name: 'Enviadas', value: companies.filter(c => c.campaignStatus === CampaignStatus.SENT).length },
                { name: 'Entregues', value: companies.filter(c => c.campaignStatus === CampaignStatus.DELIVERED).length },
                { name: 'Respondidas', value: companies.filter(c => c.campaignStatus === CampaignStatus.REPLIED).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Status da IA</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${aiConfig.aiActive ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-slate-100 text-slate-400'}`}>
               <Bot size={48} />
             </div>
             <h4 className="text-xl font-bold text-slate-800 mb-1">
               {aiConfig.aiActive ? 'IA Ativa e Respondendo' : 'IA Pausada'}
             </h4>
             <p className="text-sm text-slate-500 mb-6">
               {aiConfig.aiActive ? 'O bot está processando mensagens recebidas.' : 'O bot não responderá a ninguém.'}
             </p>
             <button 
               onClick={toggleAiActive}
               className={`btn-base w-full ${aiConfig.aiActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'}`}
             >
               {aiConfig.aiActive ? 'Desativar IA' : 'Ativar IA Agora'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ImportView = () => (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Importar Dados da SEFAZ</h2>
        <p className="text-slate-500 text-lg">Carregue o PDF oficial para alimentar sua base de leads.</p>
      </div>

      <div className="card-premium p-10 text-center">
        <div className="border-3 border-dashed border-slate-200 rounded-3xl p-12 hover:border-brand-500 hover:bg-brand-50/30 transition-all duration-300 group cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          
          <div className="relative z-10 pointer-events-none">
            <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Arraste seu PDF aqui</h3>
            <p className="text-slate-400 mb-8">ou clique para selecionar do computador</p>
            <div className="inline-flex btn-primary pointer-events-none">
              Selecionar Arquivo
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium mb-2 text-slate-600">
              <span>Processando I.E. e CNPJs...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-300 relative overflow-hidden"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_1s_infinite_-45deg]"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const EmpresasView = () => (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Base de Empresas</h2>
          <p className="text-slate-500">Gerencie todos os leads importados.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Filter size={18} /> Filtrar
          </button>
          <button className="btn-primary">
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="card-premium flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por Razão Social, CNPJ ou IE..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
        
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Empresa</th>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Documentos</th>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Situação</th>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Motivo (SEFAZ)</th>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Cidade</th>
                <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{company.razaoSocial}</div>
                    <div className="text-xs text-slate-400">{company.nomeContador || 'Sem contador'}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div>CNPJ: {company.cnpj}</div>
                    <div className="text-xs text-slate-400">IE: {company.inscricaoEstadual}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                      ${company.situacaoCadastral === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' : 
                        company.situacaoCadastral === 'INAPTA' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }
                    `}>
                      {company.situacaoCadastral}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={company.motivoSituacao}>
                    {company.motivoSituacao}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{company.municipio}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        company.campaignStatus === CampaignStatus.PENDING ? 'bg-slate-300' :
                        company.campaignStatus === CampaignStatus.SENT ? 'bg-blue-500' :
                        company.campaignStatus === CampaignStatus.REPLIED ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-sm text-slate-600 capitalize">{company.campaignStatus}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const CampaignView = () => {
    // Filter companies
    const filteredCompanies = companies.filter(c => {
      // Filter by Campaign Status
      const statusMatch = campaignFilter === 'all' || c.campaignStatus === campaignFilter;
      // Filter by Reason (Motivo)
      const reasonMatch = campaignReasonFilter === 'all' || c.motivoSituacao === campaignReasonFilter;
      
      return statusMatch && reasonMatch;
    });

    const toggleSelectAll = () => {
      if (selectedCompanies.length === filteredCompanies.length) {
        setSelectedCompanies([]);
      } else {
        setSelectedCompanies(filteredCompanies.map(c => c.id));
      }
    };

    const toggleSelectCompany = (id: string) => {
      if (selectedCompanies.includes(id)) {
        setSelectedCompanies(prev => prev.filter(cid => cid !== id));
      } else {
        setSelectedCompanies(prev => [...prev, id]);
      }
    };

    return (
      <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestão de Campanhas</h2>
            <p className="text-slate-500">Organize seus disparos e acompanhe os leads.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${aiConfig.aiActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <Bot size={16} />
                {aiConfig.aiActive ? 'IA Ativa' : 'IA Pausada'}
             </span>
             <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiConfig.aiActive} onChange={toggleAiActive} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          {/* Left Column: Filters & Config */}
          <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
            
            <div className="card-premium p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Filter size={18} className="text-brand-600" />
                Filtros de Lista
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status da Campanha</label>
                  <select 
                    className="input-premium"
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value as any)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value={CampaignStatus.PENDING}>Pendentes (Não contatados)</option>
                    <option value={CampaignStatus.SENT}>Enviados</option>
                    <option value={CampaignStatus.REPLIED}>Respondidos (Leads)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo da Inaptidão</label>
                  <select 
                    className="input-premium"
                    value={campaignReasonFilter}
                    onChange={(e) => setCampaignReasonFilter(e.target.value)}
                  >
                    <option value="all">Todos os Motivos</option>
                    {uniqueReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card-premium p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-brand-600" />
                Configuração do Disparo
              </h3>
              
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem Inicial</label>
                  <textarea 
                    className="input-premium min-h-[120px] resize-none"
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Digite a mensagem de abertura..."
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Dica: Seja breve. A IA assumirá a conversa assim que o cliente responder, usando a Base de Conhecimento.
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-slate-600">Selecionados:</span>
                    <span className="text-lg font-bold text-brand-600">{selectedCompanies.length}</span>
                  </div>
                  <button 
                    onClick={handleCampaignBlast}
                    disabled={selectedCompanies.length === 0}
                    className="btn-primary w-full shadow-lg shadow-brand-500/20"
                  >
                    <Send size={18} />
                    Disparar Campanha
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2 card-premium flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  checked={filteredCompanies.length > 0 && selectedCompanies.length === filteredCompanies.length}
                  onChange={toggleSelectAll}
                />
                <span className="text-sm font-semibold text-slate-600">Selecionar Todos ({filteredCompanies.length})</span>
              </div>
              <span className="text-xs text-slate-400">Exibindo {filteredCompanies.length} empresas</span>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar p-0">
              {filteredCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Filter size={48} className="mb-4 opacity-20" />
                  <p>Nenhuma empresa encontrada com os filtros atuais.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.map((company) => (
                      <tr 
                        key={company.id} 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedCompanies.includes(company.id) ? 'bg-blue-50/50' : ''}`}
                        onClick={() => toggleSelectCompany(company.id)}
                      >
                        <td className="p-4 w-12">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={() => toggleSelectCompany(company.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{company.razaoSocial}</div>
                          <div className="text-xs text-slate-500">{company.motivoSituacao}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${company.campaignStatus === CampaignStatus.REPLIED ? 'bg-emerald-100 text-emerald-700' :
                              company.campaignStatus === CampaignStatus.SENT ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }
                          `}>
                            {company.campaignStatus === CampaignStatus.PENDING ? 'Pendente' : company.campaignStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-xs text-slate-400">
                            {company.telefone || 'Sem telefone'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KnowledgeBaseView = () => {
    const selectedRule = knowledgeRules.find(r => r.id === selectedRuleId);

    return (
      <div className="h-full flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Base de Conhecimento</h2>
            <p className="text-slate-500">Treine a IA para lidar com cada situação fiscal.</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
          {/* Rules List */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 card-premium flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
              Motivos Identificados
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-1">
              {knowledgeRules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 border
                    ${selectedRuleId === rule.id 
                      ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' 
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                    }
                  `}
                >
                  <div className="font-medium truncate mb-1">{rule.motivoSituacao}</div>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {rule.isActive ? 'Ativo' : 'Inativo'}
                  </div>
                </button>
              ))}
              
              <button className="w-full p-3 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2 text-sm mt-2">
                <Plus size={16} /> Adicionar Nova Regra
              </button>
            </div>
          </div>

          {/* Editor & Simulator */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
            {selectedRule ? (
              <>
                <div className="card-premium p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{selectedRule.motivoSituacao}</h3>
                      <p className="text-sm text-slate-400">Configure como a IA deve reagir a este problema.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-slate-600">Regra Ativa</span>
                        <input 
                          type="checkbox" 
                          checked={selectedRule.isActive}
                          onChange={(e) => handleSaveRule({...selectedRule, isActive: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500" />
                        Diagnóstico (O que é isso?)
                      </label>
                      <textarea 
                        className="input-premium h-24 resize-none"
                        value={selectedRule.diagnosis}
                        onChange={(e) => handleSaveRule({...selectedRule, diagnosis: e.target.value})}
                        placeholder="Explique o problema técnico para a IA entender o contexto..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          Solução Técnica (O que fazer?)
                        </label>
                        <textarea 
                          className="input-premium h-32 resize-none"
                          value={selectedRule.solution}
                          onChange={(e) => handleSaveRule({...selectedRule, solution: e.target.value})}
                          placeholder="Liste os passos para regularizar..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Megaphone size={16} className="text-brand-500" />
                          Argumento de Venda (Pitch)
                        </label>
                        <textarea 
                          className="input-premium h-32 resize-none"
                          value={selectedRule.salesPitch}
                          onChange={(e) => handleSaveRule({...selectedRule, salesPitch: e.target.value})}
                          placeholder="Como convencer o cliente a fechar o serviço?"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-premium p-0 overflow-hidden bg-slate-900 border-slate-800 text-slate-200">
                   <div className="p-3 bg-slate-950 flex items-center gap-2 border-b border-slate-800">
                     <Terminal size={16} className="text-emerald-400" />
                     <span className="text-xs font-mono text-emerald-400">SIMULADOR DE RESPOSTA IA</span>
                   </div>
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs font-mono text-slate-500 mb-2 uppercase">Entrada Simulada</p>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm mb-4">
                          <p className="text-slate-300">Empresa: <span className="text-white font-semibold">MERCADINHO EXEMPLO</span></p>
                          <p className="text-slate-300">Situação: <span className="text-rose-400 font-semibold">{selectedRule.motivoSituacao}</span></p>
                          <p className="text-slate-500 mt-2 italic">"Cliente: Olá, recebi sua mensagem. O que está acontecendo com minha empresa?"</p>
                        </div>
                        <button className="btn-primary w-full py-2 text-sm">
                          <RefreshCw size={14} /> Gerar Resposta Teste
                        </button>
                      </div>
                      <div className="relative">
                        <p className="text-xs font-mono text-slate-500 mb-2 uppercase">Saída da IA</p>
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm h-full font-mono text-emerald-50 leading-relaxed whitespace-pre-wrap">
                           {getAiResponse(selectedRule.motivoSituacao)}
                         </div>
                      </div>
                   </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p>Selecione uma regra ao lado para editar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const WhatsappView = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Conexão WhatsApp</h2>
        <p className="text-slate-500 text-lg">Conecte seu número para a IA disparar mensagens.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-premium p-8 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200">
              {whatsappSession.status === 'connected' ? (
                <CheckCircle2 size={80} className="text-emerald-500" />
              ) : (
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ExampleQRCodeForDemo" 
                  alt="QR Code" 
                  className="w-48 h-48 opacity-50 blur-[2px]" 
                />
              )}
            </div>
            {whatsappSession.status !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-xl shadow-lg border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 mb-2">Simulação</p>
                  <button 
                    onClick={() => setWhatsappSession({ status: 'connected', phoneNumber: '+55 71 99999-9999' })}
                    className="btn-primary py-2 text-sm"
                  >
                    Simular Conexão
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${whatsappSession.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-700">
              {whatsappSession.status === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {whatsappSession.status === 'connected' && (
            <p className="text-slate-500">{whatsappSession.phoneNumber}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-premium p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings size={18} /> Configurações da Sessão
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-600">Disparo Automático</span>
                <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                 <span className="text-sm font-medium text-slate-600">IA Respondendo</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={aiConfig.aiActive} onChange={toggleAiActive} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 bg-slate-900 border-slate-800 text-slate-300 font-mono text-xs h-48 overflow-y-auto custom-scrollbar">
            <div className="text-emerald-400 mb-2">$ system logs --tail</div>
            <p>[10:42:12] Initializing Baileys socket...</p>
            <p>[10:42:13] Connecting to WS...</p>
            {whatsappSession.status === 'connected' && (
              <>
                <p className="text-emerald-400">[10:42:15] Connection authenticated!</p>
                <p>[10:42:15] Syncing contacts...</p>
                <p>[10:42:16] Ready to send messages.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'import': return <ImportView />;
      case 'empresas': return <EmpresasView />;
      case 'campanhas': return <CampaignView />;
      case 'knowledge': return <KnowledgeBaseView />;
      case 'whatsapp': return <WhatsappView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 shadow-2xl z-20
          ${sidebarOpen ? 'w-72' : 'w-20'}
        `}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
              V
            </div>
            <span className={`font-bold text-xl text-white tracking-tight whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              CRM VIRGULA
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <div className="space-y-8">
            <div>
              {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Visão Geral</h3>}
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                collapsed={!sidebarOpen}
              />
            </div>

            <div>
              {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Aquisição</h3>}
              <SidebarItem 
                icon={Upload} 
                label="Importar Dados" 
                active={activeTab === 'import'} 
                onClick={() => setActiveTab('import')} 
                collapsed={!sidebarOpen}
              />
              <SidebarItem 
                icon={Briefcase} 
                label="Base de Empresas" 
                active={activeTab === 'empresas'} 
                onClick={() => setActiveTab('empresas')} 
                collapsed={!sidebarOpen}
              />
            </div>

            <div>
              {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vendas</h3>}
              <SidebarItem 
                icon={Megaphone} 
                label="Gestão de Campanhas" 
                active={activeTab === 'campanhas'} 
                onClick={() => setActiveTab('campanhas')} 
                collapsed={!sidebarOpen}
              />
              <SidebarItem 
                icon={MessageCircle} 
                label="Conexão WhatsApp" 
                active={activeTab === 'whatsapp'} 
                onClick={() => setActiveTab('whatsapp')} 
                collapsed={!sidebarOpen}
              />
            </div>

            <div>
              {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inteligência</h3>}
              <SidebarItem 
                icon={BookOpen} 
                label="Treinamento IA" 
                active={activeTab === 'knowledge'} 
                onClick={() => setActiveTab('knowledge')} 
                collapsed={!sidebarOpen}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <button 
             onClick={toggleAiActive}
             className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${aiConfig.aiActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
             <Power size={20} className={aiConfig.aiActive ? 'text-emerald-400' : 'text-slate-500'} />
             {sidebarOpen && (
               <div className="flex flex-col text-left">
                 <span className="text-xs font-medium uppercase tracking-wider">Status do Bot</span>
                 <span className="text-sm font-bold">{aiConfig.aiActive ? 'ATIVO' : 'PAUSADO'}</span>
               </div>
             )}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              Sistema Online
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-slate-200">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
