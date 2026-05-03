import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Calendar, Info, Plane, Car, Ticket, Utensils, Hotel, Plus, Trash2, MapPin, ChevronDown, Clock
} from 'lucide-react';
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#e67e22',
      }
    },
  },
  plugins: [],
}



// Substitua pelo seu objeto de configuração do Firebase Console
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

  // Estados iniciais baseados no planejamento de maio de 2026
  const [essentials, setEssentials] = useState({
    acomodacao: { 
      local: 'Airbnb', 
      endereco: 'Rua São Pedro, 1141', 
      checkin: '2026-05-12', 
      checkinHora: '14:00',
      checkout: '2026-05-16', 
      checkoutHora: '11:00',
      status: 'PENDENTE' 
    },
    partida: { data: '', hora: '', voo: '' },
    retorno: { data: '', hora: '', voo: '' },
    notas: ''
  });

  const [tripData, setTripData] = useState({
    VOOS: [],
    TRANSPORTE: [],
    ESTADIA: [],
    PASSEIOS: [],
    GASTRONOMIA: []
  });

  // Auth & Sync
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
    }, (err) => console.error("Erro sync:", err));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const saveData = async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'travelData', 'main');
      await setDoc(docRef, { essentials, tripData }, { merge: true });
    };
    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [essentials, tripData, user, dataLoaded]);

  // Cálculos de investimento para o casal
  const totals = useMemo(() => {
    const res = {};
    Object.keys(tripData).forEach(cat => {
      res[cat] = tripData[cat].reduce((sum, item) => {
        let val = 0;
        if (item.base === 'PESSOA') {
          val = (Number(item.valorPessoa1) || 0) + (Number(item.valorPessoa2) || 0);
        } else {
          val = Number(item.valor) || 0;
        }
        return sum + val;
      }, 0);
    });
    res.totalGeral = Object.values(res).reduce((a, b) => a + b, 0);
    return res;
  }, [tripData]);

  const addItem = (cat) => {
    const newItem = { 
      id: Date.now(), 
      nome: '', 
      valor: 0, 
      valorPessoa1: 0,
      valorPessoa2: 0,
      dia: 'DIA 1', 
      local: 'GRAMADO', 
      compra: 'DINHEIRO/CARTÃO',
      base: 'CASAL' 
    };
    setTripData(prev => ({ ...prev, [cat]: [...prev[cat], newItem] }));
  };

  const updateItem = (cat, id, field, val) => {
    setTripData(prev => ({
      ...prev,
      [cat]: prev[cat].map(it => it.id === id ? { ...it, [field]: val } : it)
    }));
  };

  const removeItem = (cat, id) => {
    setTripData(prev => ({ ...prev, [cat]: prev[cat].filter(it => it.id !== id) }));
  };

  const NavButton = ({ label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(label)}
      className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-[11px] transition-all border ${
        activeTab === label 
        ? 'bg-[#e67e22] text-white border-[#e67e22] shadow-md' 
        : 'bg-white text-[#bdc3c7] border-stone-100 hover:border-stone-300'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#2c3e50] p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#e67e22] p-1.5 rounded-lg text-white">
            <Calendar size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-stone-900">GRAMADO 26</h1>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Investimento Casal</p>
          <p className="text-3xl font-black text-[#e67e22]">R$ {totals.totalGeral.toLocaleString('pt-BR')}</p>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto flex flex-wrap gap-3 mb-12">
        <NavButton label="GERAL" icon={Info} />
        <NavButton label="ROTEIRO" icon={MapPin} />
        <NavButton label="VOOS" icon={Plane} />
        <NavButton label="TRANSPORTE" icon={Car} />
        <NavButton label="ESTADIA" icon={Hotel} />
        <NavButton label="PASSEIOS" icon={Ticket} />
        <NavButton label="GASTRONOMIA" icon={Utensils} />
      </nav>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'GERAL' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-50">
              <h3 className="text-[#e67e22] font-black text-[10px] uppercase mb-6 flex items-center gap-2">
                <Hotel size={14} /> Acomodação
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1">Local</label>
                  <input className="w-full bg-[#f8f9fa] p-3 rounded-xl font-bold text-stone-700 outline-none" value={essentials.acomodacao.local} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, local: e.target.value}})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1 flex items-center gap-1"><Calendar size={8}/> Check-in</label>
                    <input type="date" className="w-full bg-[#f8f9fa] p-3 rounded-xl font-bold text-[10px] outline-none" value={essentials.acomodacao.checkin} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkin: e.target.value}})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1 flex items-center gap-1"><Clock size={8}/> Horário</label>
                    <input type="time" className="w-full bg-[#f8f9fa] p-3 rounded-xl font-bold text-[10px] outline-none" value={essentials.acomodacao.checkinHora} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkinHora: e.target.value}})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1 flex items-center gap-1"><Calendar size={8}/> Check-out</label>
                    <input type="date" className="w-full bg-[#f8f9fa] p-3 rounded-xl font-bold text-[10px] outline-none" value={essentials.acomodacao.checkout} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkout: e.target.value}})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1 flex items-center gap-1"><Clock size={8}/> Horário</label>
                    <input type="time" className="w-full bg-[#f8f9fa] p-3 rounded-xl font-bold text-[10px] outline-none" value={essentials.acomodacao.checkoutHora} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, checkoutHora: e.target.value}})} />
                  </div>
                </div>

                <div className="pt-2">
                   <label className="text-[9px] font-bold text-stone-300 uppercase block mb-1">Status</label>
                   <select className="w-full bg-[#fff9e6] p-3 rounded-xl text-[#e67e22] font-black text-[10px] text-center border border-[#feebc8] outline-none" value={essentials.acomodacao.status} onChange={e => setEssentials({...essentials, acomodacao: {...essentials.acomodacao, status: e.target.value}})}>
                     <option value="PENDENTE">PENDENTE</option>
                     <option value="CONFIRMADO">CONFIRMADO</option>
                     <option value="PAGO">PAGO</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-50 md:col-span-2">
              <h3 className="text-[#e67e22] font-black text-[10px] uppercase mb-4 flex items-center gap-2"><Info size={14} /> Notas da Viagem</h3>
              <textarea className="w-full h-48 bg-[#f8f9fa] rounded-2xl p-6 border-none text-stone-500 font-medium text-sm outline-none resize-none" value={essentials.notas} onChange={e => setEssentials({...essentials, notas: e.target.value})} placeholder="Dicas, orçamentos e lembretes..." />
            </div>
          </div>
        )}

        {/* Adicione aqui os blocos das outras abas conforme necessário */}
      </div>
    </div>
  );
};

export default App;