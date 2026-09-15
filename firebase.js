// Importa as funções do Firebase direto da nuvem do Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sua configuração oficial do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBM4YmeI3r8hojjpI3n0wJsOrV5h3KFH9M",
  authDomain: "portal-47793.firebaseapp.com",
  projectId: "portal-47793",
  storageBucket: "portal-47793.firebasestorage.app",
  messagingSenderId: "746031374293",
  appId: "1:746031374293:web:ddb18d9faec8530a72675c"
};

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Ativa a persistência offline via cache local (IndexedDB)
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Persistência offline falhou: Múltiplas abas abertas ao mesmo tempo.");
    } else if (err.code === 'unimplemented') {
      console.warn("O navegador atual não suporta recursos de persistência offline.");
    }
  });
