// ============================================================
//  permissoes.js — TUDO em um arquivo só
//
//  Uso na página:
//    import { exigirAdmin, exigirUsuario } from "./permissoes.js";
//    exigirAdmin((user, perms) => { ... });    // página só admin
//    exigirUsuario((user, perms) => { ... });  // admin + escola
//
//  Para bloquear/liberar itens do menu:
//    edite o objeto PERMISSOES logo abaixo. NÃO mexa no HTML.
// ============================================================

import { db, auth } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
//  LISTA DE BLOQUEIO — edite SÓ esta parte no dia a dia
// ------------------------------------------------------------
//  Chave = seletor CSS (id, classe ou atributo)
//  Valor = quem vê:
//      "todos"   → admin + escola
//      "admin"   → só administrador
//      "escola"  → só escola
//      "ninguem" → esconde de todos
//
//  Item que NÃO está na lista = visível para todos.
//  Seletor que não existe na página = ignorado sem erro.
// ============================================================
const PERMISSOES = {

    // -------- MENU LATERAL --------
    'a[href="servidores.html"]'      : 'admin',
    'a[href="configuracao.html"]'    : 'admin',
    '#menuItemConfigurarPeriodos'    : 'admin',
    'a[href="configuracoes.html"]'   : 'admin',
    'a[href="calculo.html"]'         : 'admin',
    'a[href="escola.html"]'          : 'todos',
    'a[href="linha_tempo.html"]'     : 'todos',
    'a[href="relatorios.html"]'      : 'todos',

    // -------- ALERTAS DA HOME --------
    '#alertaAtencao'                 : 'admin',
    '#alertaCritico'                 : 'admin',

    // -------- CARDS / SEÇÕES --------
    '#faixaStatus'                                 : 'admin',
    'section[aria-labelledby="resumoTitulo"]'      : 'admin',
    'section[aria-labelledby="pendTitulo"]'        : 'admin',

    // -------- MÓDULOS DO GRID --------
    'a.modulo-card[href="servidores.html"]'        : 'admin',
    'a.modulo-card[href="configuracao.html"]'      : 'admin',
    'a.modulo-card[href="calculo.html"]'           : 'admin',
    'a.modulo-card[href="escola.html"]'            : 'todos',
    'a.modulo-card[href="linha_tempo.html"]'       : 'todos',
    'a.modulo-card[href="relatorios.html"]'        : 'todos',

    // -------- BOTÕES --------
    '#btnAtualizar'                  : 'admin',
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

async function carregarPermissoes(uid) {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (!snap.exists()) return null;

    const d = snap.data();
    const perfil = normalizarTexto(d.perfil || "");
    const escolas = Array.isArray(d.escola)
        ? d.escola.map(e => String(e || "").trim()).filter(Boolean)
        : (d.escola ? [String(d.escola).trim()] : []);
    const admin = ehAdminPerfil(perfil);

    return {
        perfil,
        escolas,
        ehAdmin: admin,
        temAcessoEscola(escola) {
            if (!escola) return false;
            if (admin) return true;
            const alvo = normalizarTexto(escola);
            return escolas.some(e => normalizarTexto(e) === alvo);
        }
    };
}

function aplicarPermissoes(perms) {
    const chave = perms.ehAdmin ? "admin" : "escola";

    for (const [seletor, regra] of Object.entries(PERMISSOES)) {
        const liberado =
            regra === "todos" ||
            regra === "admin,escola" ||
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

            aplicarPermissoes(perms); // esconde menu antes de liberar

            executou = true;
            callback(user, perms);

        } catch (e) {
            console.error("[Permissões] Erro:", e);
            window.location.href = "inicial.html";
        }
    });
}

// -------- guards públicos --------
export function exigirAdmin(callback) {
    _exigirLogin((user, perms) => {
        if (!perms.ehAdmin) { window.location.href = "inicial.html"; return; }
        callback(user, perms);
    });
}

export function exigirUsuario(callback) {
    _exigirLogin((user, perms) => callback(user, perms));
}
