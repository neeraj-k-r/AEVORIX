import { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Brain, 
  Zap, 
  BarChart, 
  Send, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAiApi } from '../../hooks/useApi';
import { useToast } from '../components/Toast';
import { Badge, Button, Card } from '../components';

const QUICK_PROMPTS = [
  "What are the patient's current diagnoses?",
  "List all medications with dosages",
  "Interpret the latest lab results",
  "Are there any drug interactions?",
  "What are the patient's allergies?",
  "Provide a clinical summary",
  "What follow-up is recommended?",
];

export default function AIWidget({ patientCode }) {
  const { aiQuery, aiQuickPrompts, aiRiskAnalysis, aiRiskContributions } = useAiApi();
  const { error: showError, success: showSuccess } = useToast();
  
  const [activeTab, setActiveTab] = useState('query'); // 'query' | 'risk'
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [riskContributions, setRiskContributions] = useState([]);

  // Load quick prompts on mount
  useEffect(() => {
    loadQuickPrompts();
  }, [patientCode]);

  // Load risk data when risk tab is activated
  useEffect(() => {
    if (activeTab === 'risk' && !riskData) {
      loadRiskAnalysis();
    }
  }, [activeTab]);

  const loadQuickPrompts = async () => {
    try {
      const result = await aiQuickPrompts(patientCode);
      setQuickPrompts(result.prompts || QUICK_PROMPTS);
    } catch (err) {
      setQuickPrompts(QUICK_PROMPTS);
    }
  };

  const loadRiskAnalysis = async () => {
    setIsLoading(true);
    try {
      const [risk, contributions] = await Promise.all([
        aiRiskAnalysis(patientCode),
        aiRiskContributions(patientCode),
      ]);
      setRiskData(risk);
      setRiskContributions(contributions);
    } catch (err) {
      showError('Failed to load risk analysis', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuery = async () => {
    if (!query.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await aiQuery(patientCode, query);
      const assistantMessage = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence,
      };
      setMessages(prev => [...prev, assistantMessage]);
      showSuccess('Query answered', 'success');
    } catch (err) {
      showError(err.message || 'Query failed', 'error');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your question. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setQuery(prompt);
    handleSendQuery();
  };

  const formatConfidence = (confidence) => {
    const pct = Math.round(confidence * 100);
    if (pct >= 80) return { label: 'High', class: 'bg-green-100 text-green-700' };
    if (pct >= 50) return { label: 'Medium', class: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Low', class: 'bg-red-100 text-red-700' };
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-orange-500';
    if (score >= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI Clinical Assistant</h3>
            <p className="text-xs text-slate-500">RAG Query & XAI Risk Insights</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={activeTab === 'query' ? 'primary' : 'default'} 
            onClick={() => setActiveTab('query')} className="cursor-pointer">
            <MessageSquare className="w-3 h-3 mr-1" /> Query
          </Badge>
          <Badge variant={activeTab === 'risk' ? 'primary' : 'default'} 
            onClick={() => setActiveTab('risk')} className="cursor-pointer">
            <BarChart className="w-3 h-3 mr-1" /> XAI Risk
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'query' ? (
          <QueryTab 
            messages={messages}
            query={query}
            setQuery={setQuery}
            isLoading={isLoading}
            onSend={handleSendQuery}
            quickPrompts={quickPrompts}
            onQuickPrompt={handleQuickPrompt}
          />
        ) : (
          <RiskTab 
            riskData={riskData}
            riskContributions={riskContributions}
            isLoading={isLoading}
            onRefresh={loadRiskAnalysis}
          />
        )}
      </div>
    </Card>
  );
}

function QueryTab({ messages, query, setQuery, isLoading, onSend, quickPrompts, onQuickPrompt }) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[300px] pr-2">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/50" />
            <p className="text-sm">Ask me anything about this patient's records</p>
            <p className="text-xs text-slate-400 mt-1">Powered by RAG with blockchain-verified sources</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${
              msg.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 text-slate-900'
            }`}>
              <p className="text-sm">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <p className="text-xs font-medium mb-1">Sources:</p>
                  <ul className="text-xs space-y-1">
                    {msg.sources.slice(0, 3).map((source, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded">[{i + 1}]</span>
                        <span>{source.type}: {source.content_preview}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {msg.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${formatConfidence(msg.confidence).class}`}>
                    Confidence: {formatConfidence(msg.confidence).label}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing records...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-2">Quick prompts:</p>
        <div className="flex flex-wrap gap-1">
          {quickPrompts.slice(0, 6).map((prompt, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              onClick={() => onQuickPrompt(prompt)}
              className="text-xs h-auto px-2 py-1"
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
          placeholder="Ask about diagnoses, medications, labs, allergies..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          disabled={isLoading}
        />
        <Button 
          onClick={onSend} 
          loading={isLoading}
          variant="primary"
          size="md"
          disabled={!query.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function RiskTab({ riskData, riskContributions, isLoading, onRefresh }) {
  if (!riskData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Button variant="primary" onClick={onRefresh} loading={isLoading} leftIcon={<Zap className="w-4 h-4" />}>
            Generate Risk Analysis
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          Click to calculate cardiometabolic risk with XAI feature attributions
        </p>
      </div>
    );
  }

  const { overall_risk_score, risk_category, feature_attributions, clinical_summary } = riskData;
  const riskColor = getRiskColor(overall_risk_score);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Risk Gauge */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-slate-500">Cardiometabolic Complication Risk</p>
            <p className="font-semibold text-slate-900">{risk_category.toUpperCase()} RISK</p>
          </div>
          <Badge variant={risk_category === 'low' ? 'verification' : risk_category === 'moderate' ? 'warning' : risk_category === 'high' ? 'alert' : 'danger'}>
            {overall_risk_score}%
          </Badge>
        </div>
        
        <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${riskColor}`}
            style={{ width: `${overall_risk_score}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Feature Attributions - Horizontal Bar Chart */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-1">
          <Brain className="w-4 h-4 text-primary" />
          Feature Attributions (SHAP-style)
        </h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {riskContributions.map((contrib, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{contrib.feature}</span>
                <span className="text-slate-500">{contrib.value}</span>
              </div>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    contrib.direction === 'positive' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(contrib.contribution * 2, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={contrib.direction === 'positive' ? 'text-red-600' : 'text-green-600'}>
                  {contrib.direction === 'positive' ? '↑ Increases risk' : '↓ Reduces risk'}
                </span>
                <span className="font-medium">{contrib.contribution.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Clinical Summary
        </h4>
        <p className="text-sm text-slate-600">{clinical_summary}</p>
      </div>

      <Button variant="ghost" size="sm" onClick={onRefresh} leftIcon={<Loader2 className="w-4 h-4" />}>
        Refresh Analysis
      </Button>
    </div>
  );
}

function formatConfidence(confidence) {
  const pct = Math.round(confidence * 100);
  if (pct >= 80) return { label: 'High', class: 'bg-green-100 text-green-700' };
  if (pct >= 50) return { label: 'Medium', class: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', class: 'bg-red-100 text-red-700' };
}

function getRiskColor(score) {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-orange-500';
  if (score >= 20) return 'bg-yellow-500';
  return 'bg-green-500';
}