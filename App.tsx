
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  MessageCircle, 
  Bot, 
  Settings, 
  Menu,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Megaphone,
  BookOpen,
  Plus,
  Power,
  Trash2,
  Terminal,
  Briefcase,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { CompanyResult, Status, CampaignStatus, KnowledgeRule, AIConfig, WhatsAppSession } from './types';
import { DEFAULT_KNOWLEDGE_RULES, DEFAULT_AI_PERSONA } from './constants';

// --- Custom Hooks ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any, label: string, active: boolean, onClick: () => void, collapsed: boolean }) => (
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

const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string, value: string | number, icon: any, trend?: string, color: string }) => (
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
  
  // Data State
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [knowledgeRules, setKnowledgeRules] = useLocalStorage<KnowledgeRule[]>('crm_rules', DEFAULT_KNOWLEDGE_RULES);
  const [aiConfig, setAiConfig] = useLocalStorage<AIConfig>('crm_ai_config', {
    model: 'gemini-pro',
    persona: DEFAULT_AI_PERSONA,
    knowledgeRules: DEFAULT_KNOWLEDGE_RULES,
    temperature: 0.7,
    aiActive: false
  });
  const [initialMessage, setInitialMessage] = useLocalStorage<string>('crm_initial_msg', 'Olá, tudo bem?');
  
  // WhatsApp State
  const [waSession, setWaSession] = useState<WhatsAppSession>({ status: 'disconnected' });

  // API Integration State
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(knowledgeRules[0]?.id || null);
  
  // Campaign State
  const [campaignFilter, setCampaignFilter] = useState<CampaignStatus | 'all'>('all');
  const [campaignReasonFilter, setCampaignReasonFilter] = useState<string>('all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // --- Effects ---

  // Load Companies from Backend on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Poll WhatsApp Status
  useEffect(() => {
    if (activeTab === 'whatsapp') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/whatsapp/status');
          const data = await res.json();
          setWaSession({
            status: data.status,
            qrCode: data.qr
          });
        } catch (e) {
          console.error("Erro ao buscar status do WhatsApp", e);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/get-all-results');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Falha ao buscar empresas:", error);
    }
  };

  // SSE Listener for Progress
  useEffect(() => {
    if (!currentProcessId || !isProcessing) return;

    const eventSource = new EventSource(`/progress/${currentProcessId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'not_found') return;

        const percent = data.total > 0 ? Math.round((data.processed / data.total) * 100) : 0;
        setUploadProgress(percent);
        setProcessingStatus(`Processando... ${data.processed} de ${data.total}`);

        if (data.status === 'completed' || data.status === 'error') {
          setIsProcessing(false);
          eventSource.close();
          // Fetch results specifically for this process and append/merge
          fetch(`/get-results/${currentProcessId}`)
            .then(r => r.json())
            .then(resData => {
                 fetchCompanies(); // Refresh full list
                 alert("Importação concluída com sucesso!");
                 setActiveTab('empresas');
            });
        }
      } catch (e) { console.error(e); }
    };

    return () => {
      eventSource.close();
    };
  }, [currentProcessId, isProcessing]);

  // --- Computed Data ---
  
  const stats = useMemo(() => {
    return {
      total: companies.length,
      success: companies.filter(c => c.status === 'Sucesso').length,
      pending: companies.filter(c => !c.campaignStatus || c.campaignStatus === CampaignStatus.PENDING).length,
      contacted: companies.filter(c => c.campaignStatus && c.campaignStatus !== CampaignStatus.PENDING).length,
    };
  }, [companies]);

  const uniqueReasons = useMemo(() => {
    const reasons = new Set(companies.map(c => c.motivoSituacao));
    return Array.from(reasons).filter(Boolean);
  }, [companies]);

  // --- Actions ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsProcessing(true);
      setUploadProgress(0);
      setProcessingStatus('Iniciando upload...');

      const res = await fetch('/start-processing', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setCurrentProcessId(data.processId);
      
    } catch (error) {
      console.error("Erro no upload:", error);
      setIsProcessing(false);
      alert("Erro ao enviar arquivo.");
    }
  };

  const toggleAiActive = () => {
    setAiConfig(prev => ({ ...prev, aiActive: !prev.aiActive }));
  };

  const handleSaveRule = (updatedRule: KnowledgeRule) => {
    setKnowledgeRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
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
    alert(`Mensagens enfileiradas para ${selectedCompanies.length} contatos!\nA IA assumirá a conversa quando responderem.`);
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
          value={stats.total > 0 ? "100%" : "0%"} 
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
               {aiConfig.aiActive ? 'O bot está respondendo os clientes.' : 'O bot não enviará mensagens automáticas.'}
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
              <span>{processingStatus}</span>
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
          <button className="btn-secondary" onClick={fetchCompanies}>
            <RefreshCw size={18} /> Atualizar Lista
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
                      {company.situacaoCadastral || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={company.motivoSituacao}>
                    {company.motivoSituacao}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{company.municipio}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        company.campaignStatus === CampaignStatus.PENDING || !company.campaignStatus ? 'bg-slate-300' :
                        company.campaignStatus === CampaignStatus.SENT ? 'bg-blue-500' :
                        company.campaignStatus === CampaignStatus.REPLIED ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-sm text-slate-600 capitalize">{company.campaignStatus || 'Pendente'}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhuma empresa encontrada. Faça uma importação primeiro.
                  </td>
                </tr>
              )}
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
      const statusMatch = campaignFilter === 'all' || (c.campaignStatus || CampaignStatus.PENDING) === campaignFilter;
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
                            {company.campaignStatus === CampaignStatus.PENDING || !company.campaignStatus ? 'Pendente' : company.campaignStatus}
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
            <h2 className="text-2xl font-bold text-slate-800">Base de Conhecimento IA</h2>
            <p className="text-slate-500">Ensine a IA a lidar com cada situação da SEFAZ.</p>
          </div>
          <button className="btn-secondary" onClick={() => {
            const newRule: KnowledgeRule = {
              id: Date.now().toString(),
              motivoSituacao: 'Novo Motivo',
              diagnosis: '',
              solution: '',
              salesPitch: '',
              isActive: true
            };
            setKnowledgeRules(prev => [...prev, newRule]);
            setSelectedRuleId(newRule.id);
          }}>
            <Plus size={18} /> Nova Regra
          </button>
        </div>

        <div className="flex gap-6 h-full min-h-0">
          {/* Rules List */}
          <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             <div className="p-4 bg-slate-50 border-b border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regras de Negócio</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
               {knowledgeRules.map(rule => (
                 <button
                   key={rule.id}
                   onClick={() => setSelectedRuleId(rule.id)}
                   className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                     selectedRuleId === rule.id 
                       ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' 
                       : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                   }`}
                 >
                   <div className="font-medium text-sm truncate">{rule.motivoSituacao}</div>
                   <div className="text-xs text-slate-400 mt-1 truncate">
                     {rule.salesPitch ? 'Configurado' : 'Pendente'}
                   </div>
                 </button>
               ))}
             </div>
          </div>

          {/* Editor & Simulator */}
          <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
             {selectedRule ? (
               <>
                {/* Editor */}
                <div className="card-premium p-6 overflow-y-auto custom-scrollbar">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <Settings size={18} className="text-slate-400" />
                       Configurar Regra
                     </h3>
                     <div className="flex gap-2">
                       <button 
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Regra"
                          onClick={() => {
                            setKnowledgeRules(prev => prev.filter(r => r.id !== selectedRule.id));
                            setSelectedRuleId(null);
                          }}
                        >
                          <Trash2 size={18} />
                       </button>
                     </div>
                   </div>

                   <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gatilho (Motivo na SEFAZ)</label>
                        <input 
                          type="text" 
                          className="input-premium" 
                          value={selectedRule.motivoSituacao}
                          onChange={(e) => handleSaveRule({...selectedRule, motivoSituacao: e.target.value})}
                        />
                        <p className="text-xs text-slate-400 mt-1">O texto exato que aparece na consulta da SEFAZ.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Diagnóstico (O que é?)</label>
                        <textarea 
                          className="input-premium h-24" 
                          value={selectedRule.diagnosis}
                          onChange={(e) => handleSaveRule({...selectedRule, diagnosis: e.target.value})}
                          placeholder="Ex: O cliente excedeu o limite de compras do MEI..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Solução Técnica</label>
                        <textarea 
                          className="input-premium h-24" 
                          value={selectedRule.solution}
                          onChange={(e) => handleSaveRule({...selectedRule, solution: e.target.value})}
                          placeholder="Ex: Desenquadramento e migração para Simples Nacional..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Argumento de Venda (Pitch)</label>
                        <textarea 
                          className="input-premium h-32 border-brand-200 bg-brand-50/30" 
                          value={selectedRule.salesPitch}
                          onChange={(e) => handleSaveRule({...selectedRule, salesPitch: e.target.value})}
                          placeholder="Ex: Sua empresa cresceu, isso é ótimo! Mas a SEFAZ travou. Eu resolvo hoje..."
                        />
                      </div>
                   </div>
                </div>

                {/* Simulator */}
                <div className="card-premium p-6 bg-slate-50 flex flex-col">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Terminal size={18} className="text-slate-400" />
                     Simulador de Resposta
                   </h3>
                   
                   <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-inner overflow-y-auto mb-4 font-mono text-sm text-slate-600 whitespace-pre-wrap">
                      {getAiResponse(selectedRule.motivoSituacao)}
                   </div>

                   <button className="btn-secondary w-full" onClick={() => {}}>
                     <RefreshCw size={16} /> Regenerar Resposta
                   </button>
                </div>
               </>
             ) : (
               <div className="col-span-2 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 Selecione uma regra para editar
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const WhatsAppView = () => {
    const isConnected = waSession.status === 'connected';
    const isReadyForQr = waSession.status === 'qr_ready' && waSession.qrCode;

    return (
      <div className="h-full flex flex-col animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Conexão WhatsApp</h2>
          <p className="text-slate-500">Escaneie o QR Code para conectar seu bot de vendas.</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="card-premium p-10 max-w-lg w-full text-center">
            
            {/* Status Indicator */}
            <div className={`mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <MessageCircle size={32} className={isConnected ? '' : 'animate-pulse'} />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {isConnected ? 'WhatsApp Conectado' : 'Conectar WhatsApp'}
            </h3>
            
            <p className="text-slate-500 mb-8">
              {isConnected 
                ? 'Seu bot está online e pronto para enviar campanhas.' 
                : 'Abra o WhatsApp no celular > Dispositivos > Conectar'
              }
            </p>

            {/* QR Code Display */}
            {!isConnected && isReadyForQr ? (
              <div className="bg-white p-4 rounded-xl shadow-lg inline-block border border-slate-200">
                <img src={waSession.qrCode} alt="QR Code" className="w-64 h-64 object-contain" />
              </div>
            ) : !isConnected ? (
              <div className="w-64 h-64 mx-auto bg-slate-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-sm text-slate-400">Gerando QR Code...</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 justify-center">
                 <CheckCircle2 size={24} />
                 <span className="font-semibold">Sessão Ativa</span>
              </div>
            )}
            
            <div className="mt-8 text-xs text-slate-400">
              Status atual: <span className="font-mono font-bold">{waSession.status}</span>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // --- Render ---

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl relative z-20
        ${sidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <span className="font-bold text-lg">C</span>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg tracking-tight">CRM VIRGULA</h1>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            {sidebarOpen && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Visão Geral</p>}
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              collapsed={!sidebarOpen}
            />
          </div>

          <div>
            {sidebarOpen && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Aquisição</p>}
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
            {sidebarOpen && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Vendas</p>}
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
             {sidebarOpen && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Inteligência</p>}
             <SidebarItem 
              icon={BookOpen} 
              label="Treinamento IA" 
              active={activeTab === 'knowledge'} 
              onClick={() => setActiveTab('knowledge')} 
              collapsed={!sidebarOpen}
            />
             <SidebarItem 
              icon={Settings} 
              label="Configurações" 
              active={activeTab === 'config'} 
              onClick={() => setActiveTab('config')} 
              collapsed={!sidebarOpen}
            />
          </div>
        </nav>

        {/* AI Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${aiConfig.aiActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${aiConfig.aiActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-300">Status do Bot</p>
                <p className="text-xs text-slate-500 truncate">{aiConfig.aiActive ? 'Respondendo...' : 'Desconectado.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-bold border border-brand-100">
               <Briefcase size={14} /> CRM VIRGULA
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'import' && <ImportView />}
            {activeTab === 'empresas' && <EmpresasView />}
            {activeTab === 'campanhas' && <CampaignView />}
            {activeTab === 'knowledge' && <KnowledgeBaseView />}
            {activeTab === 'whatsapp' && <WhatsAppView />}
             {activeTab === 'config' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in">
                <Settings size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-slate-600">Configurações</h2>
                <p>Ajustes de sistema e API.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}