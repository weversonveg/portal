/* ==========================================
   cache.js
   Gerenciador de cache compartilhado entre páginas
========================================== */

const CACHE_KEY = 'vt_servidores_cache';
const CACHE_TIME_KEY = 'vt_servidores_cache_time';
const CACHE_INVALID_FLAG = 'vt_cache_invalido';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/* ==========================================
   CONTROLE DE INVALIDAÇÃO
   Usado quando outra página edita dados
========================================== */
export function marcarCacheInvalido() {
  localStorage.setItem(CACHE_INVALID_FLAG, 'true');
  console.log('🔄 Cache marcado como inválido');
}

export function cacheFoiInvalidado() {
  return localStorage.getItem(CACHE_INVALID_FLAG) === 'true';
}

export function limparFlagInvalidacao() {
  localStorage.removeItem(CACHE_INVALID_FLAG);
}

/* ==========================================
   VALIDAÇÃO DO CACHE
========================================== */
function cacheEhValido() {
  // Se foi invalidado por outra página, não é válido
  if (cacheFoiInvalidado()) {
    return false;
  }
  
  const dataCache = localStorage.getItem(CACHE_TIME_KEY);
  if (!dataCache) return false;
  
  const tempoDecorrido = Date.now() - parseInt(dataCache);
  return tempoDecorrido < CACHE_DURATION;
}

/* ==========================================
   OBTER SERVIDORES DO CACHE
========================================== */
export function obterServidoresCache() {
  // Se foi invalidado, limpa tudo e retorna null
  if (cacheFoiInvalidado()) {
    console.log('⚠️ Cache invalidado por outra página. Recarregando...');
    limparCacheServidores();
    limparFlagInvalidacao();
    return null;
  }
  
  if (!cacheEhValido()) {
    limparCacheServidores();
    return null;
  }
  
  const dados = localStorage.getItem(CACHE_KEY);
  if (!dados) return null;
  
  try {
    return JSON.parse(dados);
  } catch (e) {
    console.error('Erro ao ler cache:', e);
    limparCacheServidores();
    return null;
  }
}

/* ==========================================
   SALVAR SERVIDORES NO CACHE
========================================== */
export function salvarServidoresCache(servidores) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(servidores));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    return true;
  } catch (e) {
    console.error('Erro ao salvar cache:', e);
    return false;
  }
}

/* ==========================================
   LIMPAR CACHE
========================================== */
export function limparCacheServidores() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
}

/* ==========================================
   ATUALIZAR UM SERVIDOR ESPECÍFICO NO CACHE
   👇 Útil para atualizar sem recarregar tudo
========================================== */
export function atualizarServidorNoCache(id, novosDados) {
  const cache = obterServidoresCache();
  if (!cache) return false;
  
  const index = cache.findIndex(s => s.id === id);
  if (index !== -1) {
    cache[index] = { ...cache[index], ...novosDados };
    salvarServidoresCache(cache);
    console.log('✅ Servidor atualizado no cache:', id);
    return true;
  }
  return false;
}

/* ==========================================
   REMOVER SERVIDOR DO CACHE
========================================== */
export function removerServidorDoCache(id) {
  const cache = obterServidoresCache();
  if (!cache) return;
  
  const novo = cache.filter(s => s.id !== id);
  salvarServidoresCache(novo);
}

/* ==========================================
   TEMPO RESTANTE DO CACHE
========================================== */
export function tempoRestanteCache() {
  const dataCache = localStorage.getItem(CACHE_TIME_KEY);
  if (!dataCache) return 0;
  
  const restante = CACHE_DURATION - (Date.now() - parseInt(dataCache));
  return Math.max(0, Math.ceil(restante / 60000));
}
