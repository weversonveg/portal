// ============================================================
//  permissoes.js — TUDO em um arquivo só
//
//  Perfis:
//    admin  = poderes totais (inclui gerenciar usuários)
//    semed  = como admin, MAS não gerencia usuários
//    escola = só as escolas vinculadas
//
//  Uso:
//    exigirAdmin(...)   → só admin (página usuarios.html)
//    exigirGestor(...)  → admin OU semed (servidores, configuração, cálculo)
//    exigirUsuario(...) → admin, semed ou escola (páginas compartilhadas)
// ============================================================

import { db, auth } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
//  LISTA DE BLOQUEIO — edite SÓ esta parte no dia a dia
// ------------------------------------------------------------
//  Chave = seletor CSS (id, classe ou atributo)
//  Valor = quem vê:
//      "todos"           → admin + semed + escola
//      "admin"           → só admin (ex.: card Usuários)
//      "admin,semed"     → admin + semed
//      "escola"          → só escola
//      "ninguem"         → ninguém
//
//  Item que NÃO está na lista = visível para todos.
//  Seletor que não existe na página = ignorado sem erro.
// ============================================================
const PERMISSOES = {

    // -------- MENU LATERAL --------
    'a[href="servidores.html"]'      : 'admin,semed',
    'a[href="configuracao.html"]'    : 'admin,semed',
    '#menuItemConfigurarPeriodos'    : 'admin,semed',
    'a[href="configuracoes.html"]'   : 'admin,semed',
    'a[href="calculo.html"]'         : 'admin,semed',
    'a[href="escola.html"]'          : 'todos',
    'a[href="lancamentos.html"]'      : 'admin',
    'a[href="linha_tempo.html"]'     : 'todos',
    'a[href="relatorios.html"]'      : 'todos',

    // -------- ALERTAS DA HOME --------
    '#alertaAtencao'                 : 'admin,semed',
    '#alertaCritico'                 : 'admin,semed',

    // -------- CARDS / SEÇÕES --------
    '#faixaStatus'                                 : 'admin,semed',
    'section[aria-labelledby="resumoTitulo"]'      : 'admin,semed',
    'section[aria-labelledby="pendTitulo"]'        : 'admin,semed',

    // -------- MÓDULOS DO GRID --------
    'a.modulo-card[href="servidores.html"]'        : 'admin,semed',
    'a.modulo-card[href="configuracao.html"]'      : 'admin,semed',
    'a.modulo-card[href="calculo.html"]'           : 'admin,semed',
    'a.modulo-card[href="escola.html"]'            : 'todos',
    'a.modulo-card[href="linha_tempo.html"]'       : 'todos',
    'a.modulo-card[href="relatorios.html"]'        : 'todos',

    // -------- BOTÕES --------
    '#btnAtualizar'                  : 'todos',

    // ⬇️ CARD "USUÁRIOS" EM configuracoes.html — SÓ ADMIN VÊ
    '#cardUsuarios'                  : 'admin',
    'a[href="usuarios.html"]'        : 'admin',
};

// ============================================================
//  DAQUI PARA BAIXO NÃO PRECISA MEXER
// ============================================================

function normalizarTexto(v) {
    if (v == null) return "";
    return String(v).trim().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ").toUpperCase();
}

function ehAdminPerfil(perfilNorm) {
    return perfilNorm === "ADMIN" || perfilNorm === "ADMINISTRADOR";
}

function ehSemedPerfil(perfilNorm) {
    return perfilNorm === "SEMED";
}

// Gestor = admin OU semed (ambos veem todas as escolas)
function ehGestorPerfil(perfilNorm) {
    return ehAdminPerfil(perfilNorm) || ehSemedPerfil(perfilNorm);
}

async function carregarPermissoes(uid) {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (!snap.exists()) return null;

    const d = snap.data();
    const perfil = normalizarTexto(d.perfil || "");
    const escolas = Array.isArray(d.escola)
        ? d.escola.map(e => String(e || "").trim()).filter(Boolean)
        : (d.escola ? [String(d.escola).trim()] : []);

    const admin = ehAdminPerfil(perfil);
    const semed = ehSemedPerfil(perfil);
    const gestor = admin || semed;

    return {
        perfil,
        escolas,
        ehAdmin: admin,
        ehSemed: semed,
        ehGestor: gestor,
        temAcessoEscola(escola) {
            if (!escola) return false;
            if (gestor) return true;
            const alvo = normalizarTexto(escola);
            return escolas.some(e => normalizarTexto(e) === alvo);
        }
    };
}

function aplicarPermissoes(perms) {
    const chave = perms.ehAdmin ? "admin"
                : perms.ehSemed ? "semed"
                : "escola";

    for (const [seletor, regra] of Object.entries(PERMISSOES)) {
        const liberado =
            regra === "todos" ||
            regra.split(",").map(s => s.trim().toLowerCase()).includes(chave);

        document.querySelectorAll(seletor).forEach(el => {
            el.classList.toggle("oculto", !liberado);
        });
    }

    // esconde seções de menu que ficaram vazias
    document.querySelectorAll(".menu-section").forEach(sec => {
        const itens = sec.querySelectorAll(".menu-item");
        if (itens.length === 0) return;
        const visiveis = [...itens].filter(li => !li.classList.contains("oculto"));
        sec.classList.toggle("oculto", visiveis.length === 0);
    });
}

function _exigirLogin(callback) {
    let executou = false;
    onAuthStateChanged(auth, async (user) => {
        if (executou) return;
        if (!user) { window.location.href = "index.html"; return; }

        try {
            const perms = await carregarPermissoes(user.uid);
            if (!perms) { window.location.href = "index.html"; return; }

            aplicarPermissoes(perms);
            executou = true;
            callback(user, perms);

        } catch (e) {
            console.error("[Permissões] Erro:", e);
            window.location.href = "inicial.html";
        }
    });
}

// -------- guards públicos --------

// Só ADMIN (ex.: usuarios.html)
export function exigirAdmin(callback) {
    _exigirLogin((user, perms) => {
        if (!perms.ehAdmin) { window.location.href = "inicial.html"; return; }
        callback(user, perms);
    });
}

// Admin OU Semed (ex.: servidores.html, configuracao.html, calculo.html)
export function exigirGestor(callback) {
    _exigirLogin((user, perms) => {
        if (!perms.ehGestor) { window.location.href = "inicial.html"; return; }
        callback(user, perms);
    });
}

// Todos (ex.: inicial.html, lancamento.html, relatorios.html)
export function exigirUsuario(callback) {
    _exigirLogin((user, perms) => callback(user, perms));
}
