import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Calendar, Info, Plane, Car, Ticket, Utensils, Hotel, MapPin, Clock, ChevronDown
} from 'lucide-react';

// --- CONFIGURAÇÃO FIREBASE ATUALIZADA ---
const firebaseConfig = {
  apiKey: "AIzaSyADvST-opktyb3zkiwkz2ECSRDFvL2lnUk",
  authDomain: "planejador-viagem-ad658.firebaseapp.com",
  projectId: "planejador-viagem-ad658",
  storageBucket: "planejador-viagem-ad658.firebasestorage.app",
  messagingSenderId: "521034996570",
  appId: "1:521034996570:web:856972b31a3c2d40aef163",
  measurementId: "G-RHM4P4190B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'gramado-planner-v1';

const App = () => {
  const [activeTab, setActiveTab] = useState('GERAL');
  const [user, setUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados com dados de Maio de 2026
  const [essentials, setEssentials] = useState({
    acomodacao: { 
      local: 'Airbnb', endereco: 'Rua São Pedro, 1141', 
      checkin: '2026-05-12', checkinHora: '14:00',
      checkout: '2026-05-16', checkoutHora: '11:00',
      status: 'PENDENTE' 
    },
    partida: { data: '', hora: '', voo: '' },
    retorno: { data: '', hora: '', voo: '' },
    notas: ''
  });

  const [tripData, setTripData] = useState({
    VOOS: [], TRANSPORTE: [], ESTADIA: [], PASSEIOS: [], GASTRONOMIA: []
  });

  // Auth & Sync com Firestore
  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error("Erro auth:", e));
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'travelData', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.essentials) setEssentials(prev => ({ ...prev, ...d.essentials }));
        if (d.tripData) setTripData(d.tripData);
      }
      setDataLoaded(true);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const saveData = async () => {
      setSaving(true);
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'travelData', 'main');
      await setDoc(docRef, { essentials, tripData }, { merge: true });
      setTimeout(() => setSaving(false), 800);
    };
    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [essentials, tripData, user, dataLoaded]);

  const totals = useMemo(() => {
    const res = {};
    Object.keys(tripData).forEach(cat => {
      res[cat] = tripData[cat].reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
    });
    res.totalGeral = Object.values(res).reduce((a, b) => a + b, 0);
    return res;
  }, [tripData]);

  const InputField = ({ label, value, onChange, type = "text", icon: Icon }) => (
    <div className="mb-4">
      <label className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1 block flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </label>
      <input 
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-[#f4f7f6] p-3 rounded-2xl font-bold text-stone-600 outline-none border-none focus:ring-2 focus:ring-orange-100 transition-all text-sm"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#2c3e50] p-4 md:p-10 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#e67e22] p-2.5 rounded-2xl text-white shadow-xl shadow-orange-100">
            <Calendar size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-stone-800">GRAMADO 26</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Investimento Casal</p>
          <p className="text-4xl font-black text-[#e67e22]">R$ {totals.totalGeral}</p>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="max-w-7xl mx-auto flex flex-wrap gap-2 mb-12">
        {[
          {id: 'GERAL', icon: Info}, {id: 'ROTEIRO', icon: MapPin}, {id: 'VOOS', icon: Plane}, 
          {id: 'TRANSPORTE', icon: Car}, {id: 'ESTADIA', icon: Hotel}, 
          {id: 'PASSEIOS', icon: Ticket}, {id: 'GASTRONOMIA', icon: Utensils}
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-[10px] tracking-widest transition-all border ${
              activeTab === tab.id 
              ? 'bg-[#e67e22] text-white border-[#e67e22] shadow-lg shadow-orange-100' 
              : 'bg-white text-[#bdc3c7] border-stone-100 hover:border-stone-200'
            }`}
          >
            <tab.icon size={12} />
            {tab.id}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto">
        {activeTab === 'GERAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Acomodação */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
              <h3 className="text-[#e67e22] font-black text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Hotel size={14} /> Acomodação
              </h3>
              <InputField label="Local / Hotel" value={essentials.acomodacao.local} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, local: e.target.value}})} />
              <InputField label="Endereço" value={essentials.acomodacao.endereco} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, endereco: e.target.value}})} />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Check-in" type="date" value={essentials.acomodacao.checkin} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkin: e.target.value}})} />
                <InputField label="Horário" type="time" value={essentials.acomodacao.checkinHora} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkinHora: e.target.value}})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Check-out" type="date" value={essentials.acomodacao.checkout} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkout: e.target.value}})} />
                <InputField label="Horário" type="time" value={essentials.acomodacao.checkoutHora} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkoutHora: e.target.value}})} />
              </div>

              <div className="mt-4">
                <label className="text-[9px] font-black text-stone-300 uppercase mb-1 block">Status Reserva</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#fff9f2] p-4 rounded-2xl text-[#e67e22] font-black text-xs appearance-none border border-[#fef3e7] outline-none"
                    value={essentials.acomodacao.status}
                    onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, status: e.target.value}})}
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="RESERVADO">RESERVADO</option>
                    <option value="PAGO">PAGO</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-[#e67e22]" size={16} />
                </div>
              </div>
            </div>

            {/* Partida */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
              <h3 className="text-[#3498db] font-black text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Plane size={14} className="rotate-45" /> Partida
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Data" type="date" value={essentials.partida.data} onChange={e => setEssentials({...essentials, partida: {...essentials.partida, data: e.target.value}})} />
                <InputField label="Hora" type="time" value={essentials.partida.hora} onChange={e => setEssentials({...essentials, partida: {...essentials.partida, hora: e.target.value}})} />
              </div>
              <InputField label="Aeroporto / Voo" value={essentials.partida.voo} onChange={e => setEssentials({...essentials, partida: {...essentials.partida, voo: e.target.value}})} />
            </div>

            {/* Retorno */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
              <h3 className="text-[#2ecc71] font-black text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Plane size={14} className="-rotate-135" /> Retorno
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Data" type="date" value={essentials.retorno.data} onChange={e => setEssentials({...essentials, retorno: {...essentials.retorno, data: e.target.value}})} />
                <InputField label="Hora" type="time" value={essentials.retorno.hora} onChange={e => setEssentials({...essentials, retorno: {...essentials.retorno, hora: e.target.value}})} />
              </div>
              <InputField label="Aeroporto / Voo" value={essentials.retorno.voo} onChange={e => setEssentials({...essentials, retorno: {...essentials.retorno, voo: e.target.value}})} />
            </div>

            {/* Card de Investimentos (Preto) */}
            <div className="bg-[#1a1a1a] rounded-[2.5rem] p-10 shadow-2xl shadow-black/20 text-white lg:col-span-1">
              <h3 className="text-orange-500 font-black text-[9px] uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                <Info size={14} /> Investimento Total
              </h3>
              <div className="space-y-6">
                {Object.keys(tripData).map(cat => (
                  <div key={cat} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{cat}</span>
                    <span className="font-black text-sm">R$ {totals[cat]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-12 pt-6 border-t border-white/10">
                <p className="text-[9px] font-black text-stone-500 uppercase mb-1">Total Geral Casal</p>
                <p className="text-4xl font-black text-white">R$ {totals.totalGeral}</p>
              </div>
            </div>

            {/* Notas */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
              <h3 className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Info size={16} /> Notas Importantes
              </h3>
              <textarea 
                className="w-full h-64 bg-[#f8f9fa] rounded-3xl p-8 border-none text-stone-600 font-medium text-sm outline-none resize-none focus:ring-2 focus:ring-orange-50 transition-all"
                value={essentials.notas}
                onChange={e => setEssentials({...essentials, notas: e.target.value})}
                placeholder="Detalhes sobre ingressos, restaurantes Prime Gourmet..."
              />
            </div>
          </div>
        )}
      </main>

      {/* Status de Sincronização */}
      <footer className="fixed bottom-6 right-6">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-stone-100 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${saving ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
            {saving ? 'Sincronizando...' : 'Nuvem Conectada'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;