import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Set global para validação instantânea na memória
export const cpfsCadastradosCache = new Set();

export async function carregarCacheCPFs(db) {
    try {
        const cacheSalvo = sessionStorage.getItem("cpfs_cache_semed");
        
        if (cacheSalvo) {
            const listaCPFs = JSON.parse(cacheSalvo);
            cpfsCadastradosCache.clear();
            listaCPFs.forEach(cpf => cpfsCadastradosCache.add(cpf));
            return;
        }

        const querySnapshot = await getDocs(collection(db, "servidores"));
        cpfsCadastradosCache.clear();
        
        querySnapshot.forEach((doc) => {
            const dados = doc.data();
            if (dados.cpf) {
                const cpfLimpo = dados.cpf.replace(/\D/g, "");
                cpfsCadastradosCache.add(cpfLimpo);
            }
        });

        sessionStorage.setItem("cpfs_cache_semed", JSON.stringify([...cpfsCadastradosCache]));

    } catch (erro) {
        console.error("Erro ao carregar cache de CPFs:", erro);
    }
}

export function atualizarCacheAposSalvar(cpfNumeros) {
    cpfsCadastradosCache.add(cpfNumeros);
    sessionStorage.setItem("cpfs_cache_semed", JSON.stringify([...cpfsCadastradosCache]));
}
