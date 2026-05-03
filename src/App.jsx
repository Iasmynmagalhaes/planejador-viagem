import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

// 🔥 COLE SUA CONFIG AQUI
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [dados, setDados] = useState({
    viagem: "",
    notas: "",
  });

  const [loaded, setLoaded] = useState(false);

  // 🔐 Login anônimo
  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 📥 Buscar dados
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "viagens", user.uid);

    const unsub = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        setDados(docSnap.data());
      }
      setLoaded(true);
    });

    return () => unsub();
  }, [user]);

  // 💾 Salvar automático
  useEffect(() => {
    if (!user || !loaded) return;

    const timeout = setTimeout(() => {
      const ref = doc(db, "viagens", user.uid);
      setDoc(ref, dados);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [dados, user, loaded]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Planejador de Viagem ✈️</h1>

      <input
        placeholder="Nome da viagem"
        value={dados.viagem}
        onChange={(e) =>
          setDados({ ...dados, viagem: e.target.value })
        }
      />

      <br /><br />

      <textarea
        placeholder="Notas..."
        value={dados.notas}
        onChange={(e) =>
          setDados({ ...dados, notas: e.target.value })
        }
      />

      <p>💾 Salvando automaticamente...</p>
    </div>
  );
};

export default App;