Conversa com o Gemini
Por exemplo, o servidor João, ele não tem nenhuma férias, nenhuma folga, nada lançado, nenhuma falta. E na página de cálculo, tá contando que ele tem quatro faltas. Não sei da onde que ele tá buscando isso.

Para o servidor João aparecer com 4 dias de ausência sem que você tenha lançado nada recentemente, o motor de cálculo está encontrando algum registro salvo no banco de dados (Firebase) associado ao CPF dele.

No código da página de cálculo (calculo.html), existem dois lugares exatos onde o sistema busca dias para subtrair do servidor:

Coleção lancamentos_mensais (Passo 3 do código): São os lançamentos manuais feitos na tela de "Lançamentos da Unidade" (onde se registram faltas). Pode ter ficado salvo algum registro antigo com o valor 4 para o CPF dele naquele mês.

Coleção registro_ferias_folgas (Passo 4 do código): O sistema busca todos os registros de férias e folgas cadastrados no banco inteiro (ele não filtra por mês no Firebase, apenas faz o cálculo de datas depois) e cruza com o mês de referência. Se houver qualquer cadastro antigo de férias/folga para o CPF do João que caia perto ou dentro desse período, o sistema abate automaticamente.

Como descobrir exatamente de onde estão vindo esses 4 dias?
Para tirar a prova real e ver qual documento está gerando isso, você pode adicionar um rastreamento no console do navegador:

Abra a página de cálculo no seu navegador.

Pressione F12 para abrir as Ferramentas do Desenvolvedor e clique na aba Console.

Modifique temporariamente o trecho do código onde o CPF do João é processado (dentro da função executarCalculo, logo após somar os dias) para imprimir no console qual registro está puxando isso.

Ou, de forma mais prática, vá direto ao seu Firebase Firestore e verifique:

Na coleção lancamentos_mensais, procure se existe algum documento com o CPF do João e diasAfastamento igual a 4.

Na coleção registro_ferias_folgas, verifique se há algum registro de férias/folga no nome dele.

Se você limpar esses registros nessas duas coleções do Firebase, o João passará a calcular 100% dos dias úteis normalmente, sem as faltas fantasmas!

Realmente existe um lançamento de quatro faltas lá no Firebase. Mas por que que ele está registrando essas essas faltas se no sistema não tem mais? Zerei todos os meses.

Esse é um clássico "falso positivo" de sistemas web: o que você limpa ou zera na tela (front-end) nem sempre apaga o documento lá no banco de dados (Firebase).

Quando você diz que "zereis todos os meses" na tela de lançamentos, provavelmente limpou o campo de texto ou colocou 0. No entanto, se o código da tela de lançamentos (lancamentos.html) não foi programado para deletar o documento ou para sobrescrever com o valor 0 no Firestore quando o campo fica vazio, o documento antigo continua salvo lá no servidor exatamente com o valor 4.

Por que isso acontece?
Documento Órfão no Banco: O Firebase cria um documento para aquela ausência. Quando você apaga na tela, a interface visual some com o registro para você, mas o comando de exclusão (deleteDoc) ou atualização (setDoc/updateDoc) pode não ter sido disparado corretamente no banco de dados.

IDs Diferentes: Às vezes, o sistema cria um ID automático para cada lançamento. Se você alterou algo, ele pode ter gerado um novo registro em vez de atualizar o antigo, deixando o registro antigo "preso" no banco.

Como resolver:
Solução imediata: Vá direto no seu Firebase Console > Firestore Database, abra a coleção lancamentos_mensais e exclua manualmente esse documento do servidor que está com o valor 4.

Ajuste definitivo (na tela de Lançamentos): Se você quiser que isso não aconteça da próxima vez, o código da tela onde você cadastra as faltas precisa obrigatoriamente verificar: se o usuário limpou o campo ou colocou 0, ele deve executar uma exclusão (deleteDoc) no Firebase para o documento daquele servidor/mês deixar de existir, em vez de apenas ignorá-lo na tela.

Vou colar o código aqui da página de lançamentos e tem como você já atualizar isso para excluir e não ficar mais lançamentos naquele mês?

Sim, com certeza! Pode colar o código da página de lançamentos aqui.

Assim que você mandar, eu vou ajustar a lógica de salvamento para que, sempre que um lançamento for zerado ou deixado em branco, o sistema execute o comando de exclusão (deleteDoc) no Firebase. Dessa forma, o documento fantasma é apagado de vez do banco de dados e nunca mais vai puxar dias indesejados para os servidores.

Pode colar o código!

<!DOCTYPE html>

<html lang="pt-BR">



<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">



<link rel="stylesheet"

href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">



<link rel="stylesheet"

href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">



<title>Cálculo de Vales - Vale Transporte</title>



<style>



:root {

    --primary: #5b2a86;

    --primary-hover: #47206b;



    --green: #2e7d32;

    --green-hover: #1b5e20;

    --green-light: #eaf6ec;

    --green-border: #72b879;



    --red: #c62828;

    --red-hover: #a51f1f;



    --text: #263238;

    --text-secondary: #68737d;



    --border: #d9dee3;

    --background: #f4f6f8;

    --white: #ffffff;



    --shadow: 0 2px 8px rgba(0,0,0,0.06);

}



* {

    margin: 0;

    padding: 0;

    box-sizing: border-box;

    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

    -webkit-tap-highlight-color: transparent;

}



html, body {

    width: 100%;

    min-height: 100%;

}



body {

    min-height: 100vh;

    background: var(--background);

    color: var(--text);

}



/* BARRA SUPERIOR */

.topbar {

    width: calc(100% - 64px);

    max-width: 1116px;

    height: 68px;

    margin: 16px auto 0;

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    display: flex;

    align-items: center;

    padding: 0 24px;

}



.topbar-content {

    width: 100%;

    display: flex;

    align-items: center;

    gap: 14px;

}



.logo {

    width: 38px;

    height: 38px;

    object-fit: contain;

    flex-shrink: 0;

}



.system-name {

    font-size: 17px;

    font-weight: 700;

    color: #3d2450;

}



.system-divider {

    width: 1px;

    height: 24px;

    background: #dfe3e6;

    margin: 0 2px;

}



.system-module {

    font-size: 14px;

    color: var(--text-secondary);

    flex-grow: 1;

}



/* INDICADOR DE SINAL DE REDE */

.status-conexao {

    display: flex;

    align-items: center;

    gap: 8px;

    font-size: 12px;

    font-weight: 600;

    padding: 6px 12px;

    border-radius: 20px;

    background: #f1f3f5;

    border: 1px solid #e2e8f0;

}



.signal-bars {

    display: flex;

    align-items: flex-end;

    gap: 2px;

    height: 12px;

}



.signal-bars .bar {

    width: 3px;

    background-color: #2e7d32;

    border-radius: 1px;

}

.signal-bars .bar-1 { height: 3px; }

.signal-bars .bar-2 { height: 6px; }

.signal-bars .bar-3 { height: 9px; }

.signal-bars .bar-4 { height: 12px; }



.status-conexao.online {

    color: #2e7d32;

    background: #edf7ee;

    border-color: #c8e6c9;

}



/* ÁREA PRINCIPAL */

.main {

    width: calc(100% - 64px);

    max-width: 1116px;

    margin: 0 auto;

    padding: 32px 0;

}



.page-header {

    margin-bottom: 24px;

}



.breadcrumb {

    display: flex;

    align-items: center;

    gap: 7px;

    font-size: 13px;

    color: #7b858e;

    margin-bottom: 10px;

}



.breadcrumb .material-symbols-outlined {

    font-size: 17px;

}



.page-header h1 {

    font-size: 24px;

    font-weight: 700;

    color: #263238;

    margin-bottom: 6px;

}



.page-header p {

    font-size: 14px;

    color: var(--text-secondary);

}



/* CARD DE FILTROS */

.filter-card {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    padding: 24px;

    margin-bottom: 24px;

    display: flex;

    gap: 16px;

    align-items: flex-end;

}



.filter-group {

    display: flex;

    flex-direction: column;

    flex-grow: 1;

}



.filter-group label {

    font-size: 13px;

    font-weight: 600;

    color: #455a64;

    margin-bottom: 7px;

}



.filter-group input,

.filter-group select {

    height: 44px;

    padding: 0 13px;

    background: #ffffff;

    border: 1px solid var(--border);

    border-radius: 6px;

    outline: none;

    font-size: 14px;

    color: #263238;

}



.filter-group input:focus,

.filter-group select:focus {

    border-color: var(--primary);

    box-shadow: 0 0 0 3px rgba(91,42,134,.10);

}



.btn-calcular {

    height: 44px;

    background: var(--green);

    color: white;

    border: none;

    border-radius: 6px;

    padding: 0 24px;

    font-weight: 600;

    cursor: pointer;

    display: flex;

    align-items: center;

    gap: 8px;

    transition: background 0.15s;

    flex-shrink: 0;

}



.btn-calcular:hover {

    background: var(--green-hover);

}



/* RESUMO E ESTATÍSTICAS (4 COLUNAS) */

.summary-container {

    display: none;

    grid-template-columns: repeat(4, 1fr);

    gap: 16px;

    margin-bottom: 24px;

}



.summary-container.ativo {

    display: grid;

}



.summary-box {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    padding: 18px 20px;

}



.summary-box label {

    font-size: 12px;

    font-weight: 600;

    color: var(--text-secondary);

    text-transform: uppercase;

}



.summary-box p {

    font-size: 20px;

    font-weight: 700;

    color: #263238;

    margin-top: 6px;

}



/* TABELA DE RESULTADOS */

.table-card {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    overflow: hidden;

    display: none;

}



.table-card.ativo {

    display: block;

}



table {

    width: 100%;

    border-collapse: collapse;

    text-align: left;

}



th {

    background: #fafbfc;

    padding: 14px 18px;

    font-size: 12px;

    font-weight: 700;

    color: #455a64;

    border-bottom: 1px solid #e5e8eb;

    text-transform: uppercase;

}



td {

    padding: 14px 18px;

    font-size: 13px;

    color: #263238;

    border-bottom: 1px solid #edf2f7;

}



tr:hover td {

    background: #f8fafc;

}



.mensagem {

    display: none;

    padding: 12px 14px;

    border-radius: 6px;

    font-size: 13px;

    font-weight: 500;

    margin-bottom: 16px;

}



.mensagem.erro {

    display: block;

    background: #fff0f0;

    border: 1px solid #efc5c5;

    color: #c62828;

}



.mensagem.info {

    display: block;

    background: #eef2f7;

    border: 1px solid #cbd5e1;

    color: #334155;

}



.mensagem.sucesso {

    display: block;

    background: #edf7ee;

    border: 1px solid #c8e6c9;

    color: #2e7d32;

}



@media (max-width: 950px) {

    .filter-card {

        flex-direction: column;

        align-items: stretch;

    }

    .summary-container {

        grid-template-columns: repeat(2, 1fr);

    }

    table {

        display: block;

        overflow-x: auto;

    }

}



@media (max-width: 600px) {

    .summary-container {

        grid-template-columns: 1fr;

    }

}



</style>

</head>



<body>



<header class="topbar">

    <div class="topbar-content">

        <img class="logo" src="https://drive.google.com/thumbnail?id=1Epk870R1TRNRFx4ionkXV-HDkgRyrATQ" alt="Logo">

        <span class="system-name">Vale Transporte</span>

        <div class="system-divider"></div>

        <span class="system-module">Semed - Cálculo de Vales</span>

        <div class="status-conexao online">

            <div class="signal-bars">

                <span class="bar bar-1"></span>

                <span class="bar bar-2"></span>

                <span class="bar bar-3"></span>

                <span class="bar bar-4"></span>

            </div>

            <span>Online</span>

        </div>

    </div>

</header>



<main class="main">

    <div class="page-header">

        <div class="breadcrumb">

            <span class="material-symbols-outlined">home</span>

            <span>Relatórios</span>

            <span>/</span>

            <span>Cálculo de Vales</span>

        </div>

        <h1>Fechamento e Cálculo de Passes</h1>

        <p>Calcula a quantidade de vales considerando o calendário da escola, faltas e o abatimento automático de férias e folgas.</p>

    </div>



    <!-- CARD DE FILTROS -->

    <section class="filter-card">

        <div class="filter-group">

            <label for="mesReferencia">Mês de Referência</label>

            <input type="month" id="mesReferencia" onchange="verificarDiasUteis()">

        </div>



        <div class="filter-group">

            <label for="filtroEscola">Filtrar por Escola (Opcional)</label>

            <select id="filtroEscola">

                <option value="TODAS">Todas as Escolas</option>

                <option value="CEAE">CEAE</option>

                <option value="CETEPE">CETEPE</option>

                <option value="E M SÃO JOSÉ">E M SÃO JOSÉ</option>

                <option value="E M SÃO GERALDO">E M SÃO GERALDO</option>

                <option value="CMEI ANÁLIA NOGUEIRA">CMEI ANÁLIA NOGUEIRA</option>

            </select>

        </div>



        <button type="button" class="btn-calcular" onclick="executarCalculo()">

            <span class="material-symbols-outlined">calculate</span>

            Calcular Vales

        </button>

    </section>



    <div id="mensagem" class="mensagem"></div>



    <!-- RESUMO DO CÁLCULO (4 CARDS) -->

    <section id="summaryContainer" class="summary-container">

        <div class="summary-box">

            <label>Dias Úteis Base</label>

            <p id="sumDiasUteis">0</p>

        </div>

        <div class="summary-box" style="border-left: 4px solid var(--primary);">

            <label>Dias da Unidade (Escola)</label>

            <p id="sumDiasEscola" style="color: var(--primary);">Padrão</p>

        </div>

        <div class="summary-box">

            <label>Total de Vínculos</label>

            <p id="sumVinculos">0</p>

        </div>

        <div class="summary-box" style="border-left: 4px solid var(--green);">

            <label>Total Geral de Passes</label>

            <p id="sumTotalPasses" style="color: var(--green);">0</p>

        </div>

    </section>



    <!-- TABELA DE RESULTADOS -->

    <section id="tableCard" class="table-card">

        <table>

            <thead>

                <tr>

                    <th>Servidor</th>

                    <th>CPF / Matrícula</th>

                    <th>Escola / Lotação</th>

                    <th>Concessionária</th>

                    <th>Passes/Dia</th>

                    <th>Dias Úteis</th>

                    <th>Afastamentos / Ausências</th>

                    <th>Total no Mês</th>

                </tr>

            </thead>

            <tbody id="tabelaCorpo">

                <!-- Inserido via JS -->

            </tbody>

        </table>

    </section>

</main>



<script type="module">

    import { db } from "./firebase.js";

    import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



    document.addEventListener("DOMContentLoaded", function() {

        const hoje = new Date();

        const ano = hoje.getFullYear();

        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        document.getElementById("mesReferencia").value = `${ano}-${mes}`;

        verificarDiasUteis();

    });



    window.verificarDiasUteis = async function() {

        const mesAno = document.getElementById("mesReferencia").value;

        if (!mesAno) return;



        try {

            const docRef = doc(db, "configuracoes", mesAno);

            const docSnap = await getDoc(docRef);



            if (!docSnap.exists()) {

                mostrarMensagem(`Atenção: Não há dias úteis configurados para o mês ${mesAno}. Configure na tela de dias úteis antes de calcular.`, "erro");

            } else {

                ocultarMensagem();

            }

        } catch (erro) {

            console.error("Erro ao verificar dias úteis:", erro);

        }

    }



    // MOTOR DE CÁLCULO INTEGRADO COM FALTAS, FÉRIAS E FOLGAS

    window.executarCalculo = async function() {

        const mesAno = document.getElementById("mesReferencia").value;

        const escolaSelecionada = document.getElementById("filtroEscola").value;

        const msgDiv = document.getElementById("mensagem");



        msgDiv.className = "mensagem";

        msgDiv.textContent = "";



        if (!mesAno) {

            mostrarMensagem("Selecione o mês de referência.", "erro");

            return;

        }



        try {

            // 1. Pega os dias úteis configurados para o mês pela SEMED

            const configRef = doc(db, "configuracoes", mesAno);

            const configSnap = await getDoc(configRef);



            if (!configSnap.exists()) {

                mostrarMensagem(`O mês ${mesAno} não possui dias úteis cadastrados! Defina os dias úteis na tela de configuração primeiro.`, "erro");

                return;

            }



            const diasUteisBase = Number(configSnap.data().diasUteis) || 0;



            // 2. Busca customizações de dias úteis feitas pelas escolas

            const diasEscolaMap = {};

            try {

                const escolaConfigsQuery = query(collection(db, "escola_configuracoes_mensais"), where("mesReferencia", "==", mesAno));

                const escolaConfigsSnap = await getDocs(escolaConfigsQuery);

                escolaConfigsSnap.forEach(docSnap => {

                    const data = docSnap.data();

                    if (data.escola) {

                        diasEscolaMap[data.escola] = Number(data.diasUteisEscola) || diasUteisBase;

                    }

                });

            } catch (e) {

                console.log("Aviso: Configurações de dias por escola não encontradas.");

            }



            // 3. Mapeia afastamentos e faltas da tela de lançamentos

            const afastamentosMap = {};

            try {

                const lancQuery = query(collection(db, "lancamentos_mensais"), where("mesReferencia", "==", mesAno));

                const lancSnap = await getDocs(lancQuery);

                lancSnap.forEach(docSnap => {

                    const data = docSnap.data();

                    const dias = Number(data.diasAfastamento) || 0;

                    if (data.cpf) {

                        const cpfLimpo = data.cpf.replace(/\D/g, "");

                        if (data.escola) {

                            afastamentosMap[`${data.escola}_${cpfLimpo}`] = dias;

                        }

                        afastamentosMap[cpfLimpo] = dias;

                    }

                });

            } catch (e) {

                console.log("Aviso: Lançamentos mensais não encontrados.");

            }



            // 4. INTEGRAÇÃO AUTOMÁTICA: Busca Férias e Folgas cadastradas e abate do mês

            try {

                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));

                const [anoStr, mesStr] = mesAno.split("-");

                const anoNum = parseInt(anoStr);

                const mesNum = parseInt(mesStr) - 1;

                const primeiroDiaMes = new Date(anoNum, mesNum, 1);

                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);



                feriasSnap.forEach(docSnap => {

                    const data = docSnap.data();

                    if (data.cpf && data.dataInicio && data.dataFim) {

                        const cpfLimpo = data.cpf.replace(/\D/g, "");

                        const inicio = new Date(data.dataInicio + "T00:00:00");

                        const fim = new Date(data.dataFim + "T00:00:00");



                        // Calcula intersecção do período de férias/folga com o mês de referência

                        const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));

                        const endOverlap = new Date(Math.min(fim, ultimoDiaMes));



                        if (startOverlap <= endOverlap) {

                            const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;

                            if (diasNoMes > 0) {

                                afastamentosMap[cpfLimpo] = (afastamentosMap[cpfLimpo] || 0) + diasNoMes;

                            }

                        }

                    }

                });

            } catch (e) {

                console.log("Aviso: Erro ao calcular intersecção de férias e folgas:", e);

            }



            // 5. Busca os servidores no Firebase

            let q;

            if (escolaSelecionada !== "TODAS") {

                q = query(collection(db, "servidores"), where("escolas", "array-contains", escolaSelecionada));

            } else {

                q = collection(db, "servidores");

            }



            const querySnapshot = await getDocs(q);



            if (querySnapshot.empty) {

                mostrarMensagem("Nenhum servidor encontrado para o critério selecionado.", "info");

                document.getElementById("summaryContainer").classList.remove("ativo");

                document.getElementById("tableCard").classList.remove("ativo");

                return;

            }



            let linhasTabela = "";

            let totalVinculos = 0;

            let totalGeralPasses = 0;



            // 6. Processa o cálculo aplicando os dias da escola e os descontos totais de ausência

            querySnapshot.forEach((doc) => {

                const s = doc.data();

                const cpfLimpo = s.cpf ? s.cpf.replace(/\D/g, "") : "";



                function processarEscola(matriculaNum, cargo, escolaObj) {

                    if (!escolaObj) return;

                    const nomeEscola = escolaObj.nomeEscola;

                    if (!nomeEscola) return;

                    if (escolaSelecionada !== "TODAS" && nomeEscola !== escolaSelecionada) return;



                    const chaveEscolaCpf = `${nomeEscola}_${cpfLimpo}`;

                    const diasAfastamento = afastamentosMap[chaveEscolaCpf] !== undefined ? afastamentosMap[chaveEscolaCpf] : (afastamentosMap[cpfLimpo] || 0);



                    const diasUteisUnidade = diasEscolaMap[nomeEscola] !== undefined ? diasEscolaMap[nomeEscola] : diasUteisBase;

                    const diasEfetivos = Math.max(0, diasUteisUnidade - diasAfastamento);



                    const passesDiarios = Number(escolaObj.qtdPassagensDiarias) || 0;

                    const totalMes = passesDiarios * diasEfetivos;



                    totalVinculos++;

                    totalGeralPasses += totalMes;



                    linhasTabela += `

                        <tr>

                            <td><b>${s.nome}</b></td>

                            <td>${s.cpf}<br><small style="color:var(--text-secondary)">Mat: ${matriculaNum}</small></td>

                            <td>${nomeEscola}</td>

                            <td>${escolaObj.empresa}</td>

                            <td>${passesDiarios}</td>

                            <td><b>${diasUteisUnidade} dias</b> ${diasUteisUnidade !== diasUteisBase ? '<small style="color:var(--primary); font-weight:600;">(Ajustado)</small>' : ''}</td>

                            <td><span style="color:${diasAfastamento > 0 ? 'var(--red)' : 'inherit'}; font-weight:${diasAfastamento > 0 ? '700' : 'normal'}">-${diasAfastamento} dias</span></td>

                            <td><b>${totalMes} passes</b></td>

                        </tr>

                    `;

                }



                if (s.matricula1) {

                    processarEscola(s.matricula1.numeroMatricula, s.matricula1.cargo, s.matricula1.escola1);

                    processarEscola(s.matricula1.numeroMatricula, s.matricula1.cargo, s.matricula1.escola2);

                }



                if (s.matricula2) {

                    processarEscola(s.matricula2.numeroMatricula, s.matricula2.cargo, s.matricula2.escola1);

                    processarEscola(s.matricula2.numeroMatricula, s.matricula2.cargo, s.matricula2.escola2);

                }

            });



            if (totalVinculos === 0) {

                mostrarMensagem("Nenhum vínculo correspondente encontrado para esta escola no mês selecionado.", "info");

                document.getElementById("summaryContainer").classList.remove("ativo");

                document.getElementById("tableCard").classList.remove("ativo");

                return;

            }



            document.getElementById("sumDiasUteis").textContent = diasUteisBase + " dias";



            if (escolaSelecionada !== "TODAS") {

                const diasEscolaAtual = diasEscolaMap[escolaSelecionada] !== undefined ? diasEscolaMap[escolaSelecionada] : diasUteisBase;

                const statusStr = diasEscolaAtual !== diasUteisBase ? " (Ajustado)" : " (Padrão)";

                document.getElementById("sumDiasEscola").textContent = diasEscolaAtual + " dias" + statusStr;

            } else {

                const qtdCustomizadas = Object.keys(diasEscolaMap).length;

                document.getElementById("sumDiasEscola").textContent = qtdCustomizadas > 0 ? `${qtdCustomizadas} unidade(s) c/ ajuste` : "Todas no Padrão";

            }



            document.getElementById("sumVinculos").textContent = totalVinculos;

            document.getElementById("sumTotalPasses").textContent = totalGeralPasses + " passes";



            document.getElementById("tabelaCorpo").innerHTML = linhasTabela;

            document.getElementById("summaryContainer").classList.add("ativo");

            document.getElementById("tableCard").classList.add("ativo");



        } catch (erro) {

            console.error("Erro no cálculo:", erro);

            mostrarMensagem("Erro ao processar o cálculo. Verifique sua conexão.", "erro");

        }

    }



    function mostrarMensagem(texto, tipo) {

        const msg = document.getElementById("mensagem");

        msg.textContent = texto;

        msg.className = "mensagem " + tipo;

    }



    function ocultarMensagem() {

        const msg = document.getElementById("mensagem");

        msg.className = "mensagem";

        msg.textContent = "";

    }

</script>



</body>

</html>

Correção do Arquivo Colado
O código enviado é a página de Cálculo de Vales (relatório/execução), e não a tela de Lançamentos da Unidade onde as faltas são gravadas e apagadas. É por isso que este arquivo não possui lógica de salvamento ou exclusão de dados.

Para blindar este motor de cálculo e garantir que ele ignore registros fantasmas que porventura ainda estejam no banco com valores zerados ou inválidos, substitua o Passo 3 do código que você colou pelo bloco abaixo:

JavaScript
// 3. Mapeia afastamentos e faltas da tela de lançamentos (ignora se for 0 ou vazio)
const afastamentosMap = {};
try {
    const lancQuery = query(collection(db, "lancamentos_mensais"), where("mesReferencia", "==", mesAno));
    const lancSnap = await getDocs(lancQuery);
    lancSnap.forEach(docSnap => {
        const data = docSnap.data();
        const dias = Number(data.diasAfastamento) || 0;
        
        // Só armazena no mapa se houver dias maiores que zero
        if (data.cpf && dias > 0) {
            const cpfLimpo = data.cpf.replace(/\D/g, "");
            if (data.escola) {
                afastamentosMap[`${data.escola}_${cpfLimpo}`] = dias;
            }
            afastamentosMap[cpfLimpo] = dias;
        }
    });
} catch (e) {
    console.log("Aviso: Lançamentos mensais não encontrados.");
}
Como ajustar a tela de Lançamentos
Para que o sistema apague o documento do Firebase quando você zerar ou limpar o campo na tela de cadastro de faltas, o código de salvamento daquela outra página precisa executar um deleteDoc sempre que o valor enviado for 0 ou vazio ("").

Se desejar, cole o código da página de Lançamentos aqui para que eu faça essa implementação exata para você.

Desculpe, errei o código. Vou colar o código novamente de lançamento das escolas.

Sem problemas! Pode colar o código correto da página de Lançamentos aqui.

Assim que você mandar, eu vou ajustar a função de salvamento/atualização para que, quando você zerar ou limpar o campo de faltas, o sistema delete o documento do Firebase (deleteDoc), garantindo que nenhum lançamento fantasma fique salvo no banco de dados. Estou pronto!

<!DOCTYPE html>

<html lang="pt-BR">



<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">



<link rel="stylesheet"

href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">



<link rel="stylesheet"

href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">



<title>Lançamentos e Afastamentos - Vale Transporte</title>



<style>



:root {

    --primary: #5b2a86;

    --primary-hover: #47206b;



    --green: #2e7d32;

    --green-hover: #1b5e20;

    --green-light: #eaf6ec;

    --green-border: #72b879;



    --red: #c62828;

    --red-hover: #a51f1f;



    --text: #263238;

    --text-secondary: #68737d;



    --border: #d9dee3;

    --background: #f4f6f8;

    --white: #ffffff;



    --shadow: 0 2px 8px rgba(0,0,0,0.06);

}



* {

    margin: 0;

    padding: 0;

    box-sizing: border-box;

    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

    -webkit-tap-highlight-color: transparent;

}



html, body {

    width: 100%;

    min-height: 100%;

}



body {

    min-height: 100vh;

    background: var(--background);

    color: var(--text);

}



/* BARRA SUPERIOR */

.topbar {

    width: calc(100% - 64px);

    max-width: 1116px;

    height: 68px;

    margin: 16px auto 0;

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    display: flex;

    align-items: center;

    padding: 0 24px;

}



.topbar-content {

    width: 100%;

    display: flex;

    align-items: center;

    gap: 14px;

}



.logo {

    width: 38px;

    height: 38px;

    object-fit: contain;

    flex-shrink: 0;

}



.system-name {

    font-size: 17px;

    font-weight: 700;

    color: #3d2450;

}



.system-divider {

    width: 1px;

    height: 24px;

    background: #dfe3e6;

    margin: 0 2px;

}



.system-module {

    font-size: 14px;

    color: var(--text-secondary);

    flex-grow: 1;

}



/* INDICADOR DE SINAL DE REDE */

.status-conexao {

    display: flex;

    align-items: center;

    gap: 8px;

    font-size: 12px;

    font-weight: 600;

    padding: 6px 12px;

    border-radius: 20px;

    background: #f1f3f5;

    border: 1px solid #e2e8f0;

}



.signal-bars {

    display: flex;

    align-items: flex-end;

    gap: 2px;

    height: 12px;

}



.signal-bars .bar {

    width: 3px;

    background-color: #2e7d32;

    border-radius: 1px;

}

.signal-bars .bar-1 { height: 3px; }

.signal-bars .bar-2 { height: 6px; }

.signal-bars .bar-3 { height: 9px; }

.signal-bars .bar-4 { height: 12px; }



.status-conexao.online {

    color: #2e7d32;

    background: #edf7ee;

    border-color: #c8e6c9;

}



/* ÁREA PRINCIPAL */

.main {

    width: calc(100% - 64px);

    max-width: 1116px;

    margin: 0 auto;

    padding: 32px 0;

}



.page-header {

    margin-bottom: 24px;

}



.breadcrumb {

    display: flex;

    align-items: center;

    gap: 7px;

    font-size: 13px;

    color: #7b858e;

    margin-bottom: 10px;

}



.breadcrumb .material-symbols-outlined {

    font-size: 17px;

}



.page-header h1 {

    font-size: 24px;

    font-weight: 700;

    color: #263238;

    margin-bottom: 6px;

}



.page-header p {

    font-size: 14px;

    color: var(--text-secondary);

}



/* CARD DE FILTROS */

.filter-card {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    padding: 24px;

    margin-bottom: 24px;

    display: flex;

    gap: 16px;

    align-items: flex-end;

}



.filter-group {

    display: flex;

    flex-direction: column;

    flex-grow: 1;

}



.filter-group label {

    font-size: 13px;

    font-weight: 600;

    color: #455a64;

    margin-bottom: 7px;

}



.filter-group input,

.filter-group select {

    height: 44px;

    padding: 0 13px;

    background: #ffffff;

    border: 1px solid var(--border);

    border-radius: 6px;

    outline: none;

    font-size: 14px;

    color: #263238;

}



.filter-group input:focus,

.filter-group select:focus {

    border-color: var(--primary);

    box-shadow: 0 0 0 3px rgba(91,42,134,.10);

}



.btn-carregar {

    height: 44px;

    background: var(--primary);

    color: white;

    border: none;

    border-radius: 6px;

    padding: 0 24px;

    font-weight: 600;

    cursor: pointer;

    display: flex;

    align-items: center;

    gap: 8px;

    transition: background 0.15s;

    flex-shrink: 0;

}



.btn-carregar:hover {

    background: var(--primary-hover);

}



/* CARD DE DIAS ÚTEIS ESPECÍFICOS DA ESCOLA */

.school-config-card {

    display: none;

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    padding: 20px 24px;

    margin-bottom: 24px;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

}



.school-config-card.ativo {

    display: flex;

}



.school-config-info h3 {

    font-size: 15px;

    font-weight: 700;

    color: var(--primary);

    margin-bottom: 4px;

}



.school-config-info p {

    font-size: 13px;

    color: var(--text-secondary);

}



.school-config-action {

    display: flex;

    align-items: center;

    gap: 12px;

}



.input-dias-escola {

    width: 90px;

    height: 40px;

    padding: 0 10px;

    border: 1px solid var(--border);

    border-radius: 6px;

    text-align: center;

    font-weight: 700;

    font-size: 15px;

    color: var(--primary);

}



.btn-salvar-dias {

    height: 40px;

    background: var(--green);

    color: white;

    border: none;

    border-radius: 6px;

    padding: 0 16px;

    font-weight: 600;

    cursor: pointer;

    display: flex;

    align-items: center;

    gap: 6px;

}



.btn-salvar-dias:hover {

    background: var(--green-hover);

}



/* RESUMO ESTATÍSTICO */

.summary-container {

    display: none;

    grid-template-columns: repeat(2, 1fr);

    gap: 16px;

    margin-bottom: 24px;

}



.summary-container.ativo {

    display: grid;

}



.summary-box {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    padding: 18px 20px;

}



.summary-box label {

    font-size: 12px;

    font-weight: 600;

    color: var(--text-secondary);

    text-transform: uppercase;

}



.summary-box p {

    font-size: 20px;

    font-weight: 700;

    color: var(--primary);

    margin-top: 6px;

}



/* TABELA DE LANÇAMENTOS */

.table-card {

    background: var(--white);

    border: 1px solid #e0e4e7;

    border-radius: 8px;

    box-shadow: var(--shadow);

    overflow: hidden;

    display: none;

}



.table-card.ativo {

    display: block;

}



table {

    width: 100%;

    border-collapse: collapse;

    text-align: left;

}



th {

    background: #fafbfc;

    padding: 14px 18px;

    font-size: 12px;

    font-weight: 700;

    color: #455a64;

    border-bottom: 1px solid #e5e8eb;

    text-transform: uppercase;

}



td {

    padding: 14px 18px;

    font-size: 13px;

    color: #263238;

    border-bottom: 1px solid #edf2f7;

    vertical-align: middle;

}



tr:hover td {

    background: #f8fafc;

}



.input-afastamento {

    width: 80px;

    height: 36px;

    padding: 0 8px;

    border: 1px solid var(--border);

    border-radius: 4px;

    text-align: center;

    font-weight: 600;

}



.badge-salvo {

    display: inline-flex;

    align-items: center;

    gap: 4px;

    padding: 4px 8px;

    border-radius: 4px;

    font-size: 11px;

    font-weight: 600;

    background: #eaf6ec;

    color: #2e7d32;

    border: 1px solid #c8e6c9;

    margin-left: 8px;

}



.btn-salvar-linha {

    height: 36px;

    background: var(--green);

    color: white;

    border: none;

    border-radius: 4px;

    padding: 0 12px;

    font-size: 12px;

    font-weight: 600;

    cursor: pointer;

    display: inline-flex;

    align-items: center;

    gap: 4px;

}



.btn-salvar-linha:hover {

    background: var(--green-hover);

}



.mensagem {

    display: none;

    padding: 12px 14px;

    border-radius: 6px;

    font-size: 13px;

    font-weight: 500;

    margin-bottom: 16px;

}



.mensagem.erro {

    display: block;

    background: #fff0f0;

    border: 1px solid #efc5c5;

    color: #c62828;

}



.mensagem.info {

    display: block;

    background: #eef2f7;

    border: 1px solid #cbd5e1;

    color: #334155;

}



@media (max-width: 800px) {

    .filter-card {

        flex-direction: column;

        align-items: stretch;

    }

    .school-config-card {

        flex-direction: column;

        align-items: stretch;

    }

    .summary-container {

        grid-template-columns: 1fr;

    }

    table {

        display: block;

        overflow-x: auto;

    }

}



</style>

</head>



<body>



<header class="topbar">

    <div class="topbar-content">

        <img class="logo" src="https://drive.google.com/thumbnail?id=1Epk870R1TRNRFx4ionkXV-HDkgRyrATQ" alt="Logo">

        <span class="system-name">Vale Transporte</span>

        <div class="system-divider"></div>

        <span class="system-module">Semed - Gestão de Afastamentos</span>

        <div class="status-conexao online">

            <div class="signal-bars">

                <span class="bar bar-1"></span>

                <span class="bar bar-2"></span>

                <span class="bar bar-3"></span>

                <span class="bar bar-4"></span>

            </div>

            <span>Online</span>

        </div>

    </div>

</header>



<main class="main">

    <div class="page-header">

        <div class="breadcrumb">

            <span class="material-symbols-outlined">home</span>

            <span>Escola</span>

            <span>/</span>

            <span>Lançamentos e Afastamentos</span>

        </div>

        <h1>Controle de Afastamentos e Dias Úteis da Escola</h1>

        <p>Ajuste o calendário específico da unidade e registre os afastamentos individuais (férias e folgas já entram automaticamente).</p>

    </div>



    <section class="filter-card">

        <div class="filter-group">

            <label for="mesReferencia">Mês de Referência</label>

            <input type="month" id="mesReferencia">

        </div>



        <div class="filter-group">

            <label for="filtroEscola">Selecione a Escola</label>

            <select id="filtroEscola">

                <option value="">Selecione a unidade</option>

                <option value="CEAE">CEAE</option>

                <option value="CETEPE">CETEPE</option>

                <option value="E M SÃO JOSÉ">E M SÃO JOSÉ</option>

                <option value="E M SÃO GERALDO">E M SÃO GERALDO</option>

                <option value="CMEI ANÁLIA NOGUEIRA">CMEI ANÁLIA NOGUEIRA</option>

            </select>

        </div>



        <button type="button" class="btn-carregar" onclick="carregarDadosDaEscola()">

            <span class="material-symbols-outlined">search</span>

            Carregar Unidade

        </button>

    </section>



    <div id="mensagem" class="mensagem"></div>



    <section id="schoolConfigCard" class="school-config-card">

        <div class="school-config-info">

            <h3>Dias Úteis Efetivos para esta Escola</h3>

            <p id="infoSemedDefault">Padrão SEMED para o mês: carregando...</p>

        </div>

        <div class="school-config-action">

            <input type="number" id="inputDiasEscola" class="input-dias-escola" min="1" max="31" inputmode="numeric">

            <button type="button" class="btn-salvar-dias" onclick="salvarDiasUteisEscola()">

                <span class="material-symbols-outlined" style="font-size: 18px;">save</span> Salvar Dias da Escola

            </button>

        </div>

    </section>



    <section id="summaryContainer" class="summary-container">

        <div class="summary-box">

            <label>Servidores com Ausência no Mês</label>

            <p id="sumComAfastamento">0 servidores</p>

        </div>

        <div class="summary-box">

            <label>Total de Dias de Ausência Registrados</label>

            <p id="sumTotalDias">0 dias</p>

        </div>

    </section>



    <section id="tableCard" class="table-card">

        <table>

            <thead>

                <tr>

                    <th>Servidor</th>

                    <th>CPF / Matrícula</th>

                    <th>Cargo / Lotação</th>

                    <th>Dias de Ausência (Faltas / Férias / Folgas)</th>

                    <th>Ação</th>

                </tr>

            </thead>

            <tbody id="tabelaCorpo">

                </tbody>

        </table>

    </section>

</main>



<script type="module">

    import { db } from "./firebase.js";

    import { collection, getDocs, query, where, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";



    document.addEventListener("DOMContentLoaded", function() {

        const hoje = new Date();

        const ano = hoje.getFullYear();

        const mes = String(hoje.getMonth() + 1).padStart(2, '0');

        document.getElementById("mesReferencia").value = `${ano}-${mes}`;

    });



    window.carregarDadosDaEscola = async function() {

        const mesAno = document.getElementById("mesReferencia").value;

        const escola = document.getElementById("filtroEscola").value;

        const msgDiv = document.getElementById("mensagem");

        const tableCard = document.getElementById("tableCard");

        const summaryContainer = document.getElementById("summaryContainer");

        const schoolConfigCard = document.getElementById("schoolConfigCard");



        msgDiv.className = "mensagem";

        msgDiv.textContent = "";

        tableCard.classList.remove("ativo");

        summaryContainer.classList.remove("ativo");

        schoolConfigCard.classList.remove("ativo");



        if (!mesAno || !escola) {

            mostrarMensagem("Selecione o mês de referência e a escola.", "erro");

            return;

        }



        try {

            const semedConfigRef = doc(db, "configuracoes", mesAno);

            const semedSnap = await getDoc(semedConfigRef);



            const diasSemedDefault = semedSnap.exists() ? (Number(semedSnap.data().diasUteis) || 22) : 22;

            document.getElementById("infoSemedDefault").textContent = `Padrão SEMED cadastrado: ${diasSemedDefault} dias úteis no mês.`;



            const configEscolaId = `${mesAno}_${escola}`;

            const configEscolaRef = doc(db, "escola_configuracoes_mensais", configEscolaId);

            const configEscolaSnap = await getDoc(configEscolaRef);



            const diasEfetivosEscola = configEscolaSnap.exists() ? Number(configEscolaSnap.data().diasUteisEscola) : diasSemedDefault;

            document.getElementById("inputDiasEscola").value = diasEfetivosEscola;



            schoolConfigCard.classList.add("ativo");



            // BUSCA FÉRIAS/FOLGAS AUTOMÁTICAS DO MÊS PARA SOMAR AOS AFASTAMENTOS

            const feriasMap = {};

            try {

                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));

                const [anoStr, mesStr] = mesAno.split("-");

                const anoNum = parseInt(anoStr);

                const mesNum = parseInt(mesStr) - 1;

                const primeiroDiaMes = new Date(anoNum, mesNum, 1);

                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);



                feriasSnap.forEach(docSnap => {

                    const data = docSnap.data();

                    if (data.cpf && data.dataInicio && data.dataFim) {

                        const cpfLimpo = data.cpf.replace(/\D/g, "");

                        const inicio = new Date(data.dataInicio + "T00:00:00");

                        const fim = new Date(data.dataFim + "T00:00:00");



                        const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));

                        const endOverlap = new Date(Math.min(fim, ultimoDiaMes));



                        if (startOverlap <= endOverlap) {

                            const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;

                            if (diasNoMes > 0) {

                                feriasMap[cpfLimpo] = (feriasMap[cpfLimpo] || 0) + diasNoMes;

                            }

                        }

                    }

                });

            } catch (e) {

                console.log("Aviso: Erro ao carregar férias automáticas:", e);

            }



            const q = query(collection(db, "servidores"), where("escolas", "array-contains", escola));

            const querySnapshot = await getDocs(q);



            if (querySnapshot.empty) {

                mostrarMensagem("Nenhum servidor cadastrado para esta escola.", "info");

                return;

            }



            let linhasTabela = "";

            let servidoresComFalta = 0;

            let somaTotalDias = 0;



            for (const servidorDoc of querySnapshot.docs) {

                const s = servidorDoc.data();

                const servidorId = servidorDoc.id;



                let matriculaInfo = "";

                if (s.matricula1 && (s.matricula1.escola1?.nomeEscola === escola || s.matricula1.escola2?.nomeEscola === escola)) {

                    matriculaInfo = `Matrícula 1: ${s.matricula1.numeroMatricula} (${s.matricula1.cargo})`;

                } else if (s.matricula2 && (s.matricula2.escola1?.nomeEscola === escola || s.matricula2.escola2?.nomeEscola === escola)) {

                    matriculaInfo = `Matrícula 2: ${s.matricula2.numeroMatricula} (${s.matricula2.cargo})`;

                }



                const cpfLimpo = s.cpf ? s.cpf.replace(/\D/g, "") : "";

                

                // Busca manual do banco

                const lancamentoId = `${mesAno}_${escola}_${cpfLimpo}`;

                const lancRef = doc(db, "lancamentos_mensais", lancamentoId);

                const lancSnap = await getDoc(lancRef);

                

                const diasSalvosManual = lancSnap.exists() ? (Number(lancSnap.data().diasAfastamento) || 0) : 0;

                

                // Soma manual + férias/folgas automáticas

                const diasFeriasAuto = feriasMap[cpfLimpo] || 0;

                const diasTotalExibido = diasSalvosManual + diasFeriasAuto;



                if (diasTotalExibido > 0) {

                    servidoresComFalta++;

                    somaTotalDias += diasTotalExibido;

                }



                const badgeHtml = diasSalvosManual > 0 

                    ? `<span class="badge-salvo"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Salvo</span>` 

                    : (diasFeriasAuto > 0 ? `<span class="badge-salvo" style="background:#fff3e0; color:#e65100; border-color:#ffe0b2;"><span class="material-symbols-outlined" style="font-size: 14px;">event</span> Férias/Folga Auto</span>` : ``);



                linhasTabela += `

                    <tr>

                        <td><b>${s.nome}</b></td>

                        <td>${s.cpf}</td>

                        <td>${matriculaInfo}</td>

                        <td>

                            <input type="number" id="afastamento_${servidorId}" class="input-afastamento" value="${diasTotalExibido}" min="0" max="31" inputmode="numeric">

                            ${badgeHtml}

                        </td>

                        <td>

                            <button type="button" class="btn-salvar-linha" onclick="salvarAfastamento('${mesAno}', '${escola}', '${s.cpf}', '${servidorId}')">

                                <span class="material-symbols-outlined" style="font-size: 16px;">save</span> Salvar

                            </button>

                        </td>

                    </tr>

                `;

            }



            document.getElementById("sumComAfastamento").textContent = servidoresComFalta + " servidores";

            document.getElementById("sumTotalDias").textContent = somaTotalDias + " dias";



            document.getElementById("tabelaCorpo").innerHTML = linhasTabela;

            tableCard.classList.add("ativo");

            summaryContainer.classList.add("ativo");



        } catch (erro) {

            console.error("Erro ao carregar dados:", erro);

            mostrarMensagem("Erro ao carregar dados do banco.", "erro");

        }

    }



    window.salvarDiasUteisEscola = async function() {

        const mesAno = document.getElementById("mesReferencia").value;

        const escola = document.getElementById("filtroEscola").value;

        const diasEfetivos = Number(document.getElementById("inputDiasEscola").value) || 0;



        if (!mesAno || !escola) return;



        const configEscolaId = `${mesAno}_${escola}`;



        try {

            await setDoc(doc(db, "escola_configuracoes_mensais", configEscolaId), {

                mesReferencia: mesAno,

                escola: escola,

                diasUteisEscola: diasEfetivos,

                dataAtualizacao: new Date().toISOString()

            });



            alert(`Dias úteis da escola ${escola} atualizados para ${diasEfetivos} dias neste mês!`);

        } catch (erro) {

            console.error("Erro ao salvar dias úteis da escola:", erro);

            alert("Erro ao salvar os dias úteis da escola. Verifique sua conexão.");

        }

    }



    window.salvarAfastamento = async function(mesAno, escola, cpfServidor, servidorId) {

        const inputDias = document.getElementById(`afastamento_${servidorId}`);

        const diasAfastamento = Number(inputDias.value) || 0;

        const cpfLimpo = cpfServidor.replace(/\D/g, "");

        const lancamentoId = `${mesAno}_${escola}_${cpfLimpo}`;



        try {

            await setDoc(doc(db, "lancamentos_mensais", lancamentoId), {

                mesReferencia: mesAno,

                escola: escola,

                servidorId: servidorId,

                cpf: cpfServidor,

                diasAfastamento: diasAfastamento,

                dataAtualizacao: new Date().toISOString()

            }, { merge: true });



            const btnOriginal = inputDias.parentElement.nextElementSibling.querySelector("button");

            const textoOriginal = btnOriginal.innerHTML;

            btnOriginal.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span> Salvo!';

            btnOriginal.style.background = "#1b5e20";

            

            setTimeout(() => {

                btnOriginal.innerHTML = textoOriginal;

                btnOriginal.style.background = "";

                carregarDadosDaEscola();

            }, 1200);



        } catch (erro) {

            console.error("Erro ao salvar afastamento:", erro);

            alert("Erro ao salvar o afastamento. Verifique sua conexão.");

        }

    }



    function mostrarMensagem(texto, tipo) {

        const msg = document.getElementById("mensagem");

        msg.textContent = texto;

        msg.className = "mensagem " + tipo;

    }

</script>



</body>

</html>

HTML
<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="stylesheet"
href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">

<link rel="stylesheet"
href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">

<title>Lançamentos e Afastamentos - Vale Transporte</title>

<style>

:root {
    --primary: #5b2a86;
    --primary-hover: #47206b;

    --green: #2e7d32;
    --green-hover: #1b5e20;
    --green-light: #eaf6ec;
    --green-border: #72b879;

    --red: #c62828;
    --red-hover: #a51f1f;

    --text: #263238;
    --text-secondary: #68737d;

    --border: #d9dee3;
    --background: #f4f6f8;
    --white: #ffffff;

    --shadow: 0 2px 8px rgba(0,0,0,0.06);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-tap-highlight-color: transparent;
}

html, body {
    width: 100%;
    min-height: 100%;
}

body {
    min-height: 100vh;
    background: var(--background);
    color: var(--text);
}

/* BARRA SUPERIOR */
.topbar {
    width: calc(100% - 64px);
    max-width: 1116px;
    height: 68px;
    margin: 16px auto 0;
    background: var(--white);
    border: 1px solid #e0e4e7;
    border-radius: 8px;
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    padding: 0 24px;
}

.topbar-content {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
}

.logo {
    width: 38px;
    height: 38px;
    object-fit: contain;
    flex-shrink: 0;
}

.system-name {
    font-size: 17px;
    font-weight: 700;
    color: #3d2450;
}

.system-divider {
    width: 1px;
    height: 24px;
    background: #dfe3e6;
    margin: 0 2px;
}

.system-module {
    font-size: 14px;
    color: var(--text-secondary);
    flex-grow: 1;
}

/* INDICADOR DE SINAL DE REDE */
.status-conexao {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    background: #f1f3f5;
    border: 1px solid #e2e8f0;
}

.signal-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
}

.signal-bars .bar {
    width: 3px;
    background-color: #2e7d32;
    border-radius: 1px;
}
.signal-bars .bar-1 { height: 3px; }
.signal-bars .bar-2 { height: 6px; }
.signal-bars .bar-3 { height: 9px; }
.signal-bars .bar-4 { height: 12px; }

.status-conexao.online {
    color: #2e7d32;
    background: #edf7ee;
    border-color: #c8e6c9;
}

/* ÁREA PRINCIPAL */
.main {
    width: calc(100% - 64px);
    max-width: 1116px;
    margin: 0 auto;
    padding: 32px 0;
}

.page-header {
    margin-bottom: 24px;
}

.breadcrumb {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: #7b858e;
    margin-bottom: 10px;
}

.breadcrumb .material-symbols-outlined {
    font-size: 17px;
}

.page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #263238;
    margin-bottom: 6px;
}

.page-header p {
    font-size: 14px;
    color: var(--text-secondary);
}

/* CARD DE FILTROS */
.filter-card {
    background: var(--white);
    border: 1px solid #e0e4e7;
    border-radius: 8px;
    box-shadow: var(--shadow);
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    gap: 16px;
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.filter-group label {
    font-size: 13px;
    font-weight: 600;
    color: #455a64;
    margin-bottom: 7px;
}

.filter-group input,
.filter-group select {
    height: 44px;
    padding: 0 13px;
    background: #ffffff;
    border: 1px solid var(--border);
    border-radius: 6px;
    outline: none;
    font-size: 14px;
    color: #263238;
}

.filter-group input:focus,
.filter-group select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(91,42,134,.10);
}

.btn-carregar {
    height: 44px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0 24px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s;
    flex-shrink: 0;
}

.btn-carregar:hover {
    background: var(--primary-hover);
}

/* CARD DE DIAS ÚTEIS ESPECÍFICOS DA ESCOLA */
.school-config-card {
    display: none;
    background: var(--white);
    border: 1px solid #e0e4e7;
    border-radius: 8px;
    box-shadow: var(--shadow);
    padding: 20px 24px;
    margin-bottom: 24px;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.school-config-card.ativo {
    display: flex;
}

.school-config-info h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 4px;
}

.school-config-info p {
    font-size: 13px;
    color: var(--text-secondary);
}

.school-config-action {
    display: flex;
    align-items: center;
    gap: 12px;
}

.input-dias-escola {
    width: 90px;
    height: 40px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-weight: 700;
    font-size: 15px;
    color: var(--primary);
}

.btn-salvar-dias {
    height: 40px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-salvar-dias:hover {
    background: var(--green-hover);
}

/* RESUMO ESTATÍSTICO */
.summary-container {
    display: none;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.summary-container.ativo {
    display: grid;
}

.summary-box {
    background: var(--white);
    border: 1px solid #e0e4e7;
    border-radius: 8px;
    box-shadow: var(--shadow);
    padding: 18px 20px;
}

.summary-box label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.summary-box p {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    margin-top: 6px;
}

/* TABELA DE LANÇAMENTOS */
.table-card {
    background: var(--white);
    border: 1px solid #e0e4e7;
    border-radius: 8px;
    box-shadow: var(--shadow);
    overflow: hidden;
    display: none;
}

.table-card.ativo {
    display: block;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

th {
    background: #fafbfc;
    padding: 14px 18px;
    font-size: 12px;
    font-weight: 700;
    color: #455a64;
    border-bottom: 1px solid #e5e8eb;
    text-transform: uppercase;
}

td {
    padding: 14px 18px;
    font-size: 13px;
    color: #263238;
    border-bottom: 1px solid #edf2f7;
    vertical-align: middle;
}

tr:hover td {
    background: #f8fafc;
}

.input-afastamento {
    width: 80px;
    height: 36px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    text-align: center;
    font-weight: 600;
}

.badge-salvo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: #eaf6ec;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
    margin-left: 8px;
}

.btn-salvar-linha {
    height: 36px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.btn-salvar-linha:hover {
    background: var(--green-hover);
}

.mensagem {
    display: none;
    padding: 12px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 16px;
}

.mensagem.erro {
    display: block;
    background: #fff0f0;
    border: 1px solid #efc5c5;
    color: #c62828;
}

.mensagem.info {
    display: block;
    background: #eef2f7;
    border: 1px solid #cbd5e1;
    color: #334155;
}

@media (max-width: 800px) {
    .filter-card {
        flex-direction: column;
        align-items: stretch;
    }
    .school-config-card {
        flex-direction: column;
        align-items: stretch;
    }
    .summary-container {
        grid-template-columns: 1fr;
    }
    table {
        display: block;
        overflow-x: auto;
    }
}

</style>
</head>

<body>

<header class="topbar">
    <div class="topbar-content">
        <img class="logo" src="https://drive.google.com/thumbnail?id=1Epk870R1TRNRFx4ionkXV-HDkgRyrATQ" alt="Logo">
        <span class="system-name">Vale Transporte</span>
        <div class="system-divider"></div>
        <span class="system-module">Semed - Gestão de Afastamentos</span>
        <div class="status-conexao online">
            <div class="signal-bars">
                <span class="bar bar-1"></span>
                <span class="bar bar-2"></span>
                <span class="bar bar-3"></span>
                <span class="bar bar-4"></span>
            </div>
            <span>Online</span>
        </div>
    </div>
</header>

<main class="main">
    <div class="page-header">
        <div class="breadcrumb">
            <span class="material-symbols-outlined">home</span>
            <span>Escola</span>
            <span>/</span>
            <span>Lançamentos e Afastamentos</span>
        </div>
        <h1>Controle de Afastamentos e Dias Úteis da Escola</h1>
        <p>Ajuste o calendário específico da unidade e registre os afastamentos individuais (férias e folgas já entram automaticamente).</p>
    </div>

    <section class="filter-card">
        <div class="filter-group">
            <label for="mesReferencia">Mês de Referência</label>
            <input type="month" id="mesReferencia">
        </div>

        <div class="filter-group">
            <label for="filtroEscola">Selecione a Escola</label>
            <select id="filtroEscola">
                <option value="">Selecione a unidade</option>
                <option value="CEAE">CEAE</option>
                <option value="CETEPE">CETEPE</option>
                <option value="E M SÃO JOSÉ">E M SÃO JOSÉ</option>
                <option value="E M SÃO GERALDO">E M SÃO GERALDO</option>
                <option value="CMEI ANÁLIA NOGUEIRA">CMEI ANÁLIA NOGUEIRA</option>
            </select>
        </div>

        <button type="button" class="btn-carregar" onclick="carregarDadosDaEscola()">
            <span class="material-symbols-outlined">search</span>
            Carregar Unidade
        </button>
    </section>

    <div id="mensagem" class="mensagem"></div>

    <section id="schoolConfigCard" class="school-config-card">
        <div class="school-config-info">
            <h3>Dias Úteis Efetivos para esta Escola</h3>
            <p id="infoSemedDefault">Padrão SEMED para o mês: carregando...</p>
        </div>
        <div class="school-config-action">
            <input type="number" id="inputDiasEscola" class="input-dias-escola" min="1" max="31" inputmode="numeric">
            <button type="button" class="btn-salvar-dias" onclick="salvarDiasUteisEscola()">
                <span class="material-symbols-outlined" style="font-size: 18px;">save</span> Salvar Dias da Escola
            </button>
        </div>
    </section>

    <section id="summaryContainer" class="summary-container">
        <div class="summary-box">
            <label>Servidores com Ausência no Mês</label>
            <p id="sumComAfastamento">0 servidores</p>
        </div>
        <div class="summary-box">
            <label>Total de Dias de Ausência Registrados</label>
            <p id="sumTotalDias">0 dias</p>
        </div>
    </section>

    <section id="tableCard" class="table-card">
        <table>
            <thead>
                <tr>
                    <th>Servidor</th>
                    <th>CPF / Matrícula</th>
                    <th>Cargo / Lotação</th>
                    <th>Dias de Ausência (Faltas / Férias / Folgas)</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody id="tabelaCorpo">
                </tbody>
        </table>
    </section>
</main>

<script type="module">
    import { db } from "./firebase.js";
    import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    document.addEventListener("DOMContentLoaded", function() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        document.getElementById("mesReferencia").value = `${ano}-${mes}`;
    });

    window.carregarDadosDaEscola = async function() {
        const mesAno = document.getElementById("mesReferencia").value;
        const escola = document.getElementById("filtroEscola").value;
        const msgDiv = document.getElementById("mensagem");
        const tableCard = document.getElementById("tableCard");
        const summaryContainer = document.getElementById("summaryContainer");
        const schoolConfigCard = document.getElementById("schoolConfigCard");

        msgDiv.className = "mensagem";
        msgDiv.textContent = "";
        tableCard.classList.remove("ativo");
        summaryContainer.classList.remove("ativo");
        schoolConfigCard.classList.remove("ativo");

        if (!mesAno || !escola) {
            mostrarMensagem("Selecione o mês de referência e a escola.", "erro");
            return;
        }

        try {
            const semedConfigRef = doc(db, "configuracoes", mesAno);
            const semedSnap = await getDoc(semedConfigRef);

            const diasSemedDefault = semedSnap.exists() ? (Number(semedSnap.data().diasUteis) || 22) : 22;
            document.getElementById("infoSemedDefault").textContent = `Padrão SEMED cadastrado: ${diasSemedDefault} dias úteis no mês.`;

            const configEscolaId = `${mesAno}_${escola}`;
            const configEscolaRef = doc(db, "escola_configuracoes_mensais", configEscolaId);
            const configEscolaSnap = await getDoc(configEscolaRef);

            const diasEfetivosEscola = configEscolaSnap.exists() ? Number(configEscolaSnap.data().diasUteisEscola) : diasSemedDefault;
            document.getElementById("inputDiasEscola").value = diasEfetivosEscola;

            schoolConfigCard.classList.add("ativo");

            // BUSCA FÉRIAS/FOLGAS AUTOMÁTICAS DO MÊS PARA SOMAR AOS AFASTAMENTOS
            const feriasMap = {};
            try {
                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));
                const [anoStr, mesStr] = mesAno.split("-");
                const anoNum = parseInt(anoStr);
                const mesNum = parseInt(mesStr) - 1;
                const primeiroDiaMes = new Date(anoNum, mesNum, 1);
                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);

                feriasSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.cpf && data.dataInicio && data.dataFim) {
                        const cpfLimpo = data.cpf.replace(/\D/g, "");
                        const inicio = new Date(data.dataInicio + "T00:00:00");
                        const fim = new Date(data.dataFim + "T00:00:00");

                        const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));
                        const endOverlap = new Date(Math.min(fim, ultimoDiaMes));

                        if (startOverlap <= endOverlap) {
                            const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;
                            if (diasNoMes > 0) {
                                feriasMap[cpfLimpo] = (feriasMap[cpfLimpo] || 0) + diasNoMes;
                            }
                        }
                    }
                });
            } catch (e) {
                console.log("Aviso: Erro ao carregar férias automáticas:", e);
            }

            const q = query(collection(db, "servidores"), where("escolas", "array-contains", escola));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                mostrarMensagem("Nenhum servidor cadastrado para esta escola.", "info");
                return;
            }

            let linhasTabela = "";
            let servidoresComFalta = 0;
            let somaTotalDias = 0;

            for (const servidorDoc of querySnapshot.docs) {
                const s = servidorDoc.data();
                const servidorId = servidorDoc.id;

                let matriculaInfo = "";
                if (s.matricula1 && (s.matricula1.escola1?.nomeEscola === escola || s.matricula1.escola2?.nomeEscola === escola)) {
                    matriculaInfo = `Matrícula 1: ${s.matricula1.numeroMatricula} (${s.matricula1.cargo})`;
                } else if (s.matricula2 && (s.matricula2.escola1?.nomeEscola === escola || s.matricula2.escola2?.nomeEscola === escola)) {
                    matriculaInfo = `Matrícula 2: ${s.matricula2.numeroMatricula} (${s.matricula2.cargo})`;
                }

                const cpfLimpo = s.cpf ? s.cpf.replace(/\D/g, "") : "";
                
                // Busca manual do banco
                const lancamentoId = `${mesAno}_${escola}_${cpfLimpo}`;
                const lancRef = doc(db, "lancamentos_mensais", lancamentoId);
                const lancSnap = await getDoc(lancRef);
                
                const diasSalvosManual = lancSnap.exists() ? (Number(lancSnap.data().diasAfastamento) || 0) : 0;
                
                // Soma manual + férias/folgas automáticas
                const diasFeriasAuto = feriasMap[cpfLimpo] || 0;
                const diasTotalExibido = diasSalvosManual + diasFeriasAuto;

                if (diasTotalExibido > 0) {
                    servidoresComFalta++;
                    somaTotalDias += diasTotalExibido;
                }

                const badgeHtml = diasSalvosManual > 0 
                    ? `<span class="badge-salvo"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Salvo</span>` 
                    : (diasFeriasAuto > 0 ? `<span class="badge-salvo" style="background:#fff3e0; color:#e65100; border-color:#ffe0b2;"><span class="material-symbols-outlined" style="font-size: 14px;">event</span> Férias/Folga Auto</span>` : ``);

                linhasTabela += `
                    <tr>
                        <td><b>${s.nome}</b></td>
                        <td>${s.cpf}</td>
                        <td>${matriculaInfo}</td>
                        <td>
                            <input type="number" id="afastamento_${servidorId}" class="input-afastamento" value="${diasTotalExibido}" min="0" max="31" inputmode="numeric">
                            ${badgeHtml}
                        </td>
                        <td>
                            <button type="button" class="btn-salvar-linha" onclick="salvarAfastamento('${mesAno}', '${escola}', '${s.cpf}', '${servidorId}')">
                                <span class="material-symbols-outlined" style="font-size: 16px;">save</span> Salvar
                            </button>
                        </td>
                    </tr>
                `;
            }

            document.getElementById("sumComAfastamento").textContent = servidoresComFalta + " servidores";
            document.getElementById("sumTotalDias").textContent = somaTotalDias + " dias";

            document.getElementById("tabelaCorpo").innerHTML = linhasTabela;
            tableCard.classList.add("ativo");
            summaryContainer.classList.add("ativo");

        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            mostrarMensagem("Erro ao carregar dados do banco.", "erro");
        }
    }

    window.salvarDiasUteisEscola = async function() {
        const mesAno = document.getElementById("mesReferencia").value;
        const escola = document.getElementById("filtroEscola").value;
        const diasEfetivos = Number(document.getElementById("inputDiasEscola").value) || 0;

        if (!mesAno || !escola) return;

        const configEscolaId = `${mesAno}_${escola}`;

        try {
            await setDoc(doc(db, "escola_configuracoes_mensais", configEscolaId), {
                mesReferencia: mesAno,
                escola: escola,
                diasUteisEscola: diasEfetivos,
                dataAtualizacao: new Date().toISOString()
            });

            alert(`Dias úteis da escola ${escola} atualizados para ${diasEfetivos} dias neste mês!`);
        } catch (erro) {
            console.error("Erro ao salvar dias úteis da escola:", erro);
            alert("Erro ao salvar os dias úteis da escola. Verifique sua conexão.");
        }
    }

    window.salvarAfastamento = async function(mesAno, escola, cpfServidor, servidorId) {
        const inputDias = document.getElementById(`afastamento_${servidorId}`);
        const diasAfastamento = Number(inputDias.value) || 0;
        const cpfLimpo = cpfServidor.replace(/\D/g, "");
        const lancamentoId = `${mesAno}_${escola}_${cpfLimpo}`;
        const lancRef = doc(db, "lancamentos_mensais", lancamentoId);

        try {
            const btnOriginal = inputDias.parentElement.nextElementSibling.querySelector("button");
            const textoOriginal = btnOriginal.innerHTML;

            if (diasAfastamento <= 0) {
                // Se o valor for 0 ou vazio, deleta o documento do banco para evitar registros fantasmas
                await deleteDoc(lancRef);
                btnOriginal.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span> Removido!';
                btnOriginal.style.background = "#c62828";
            } else {
                // Caso contrário, salva ou atualiza normalmente
                await setDoc(lancRef, {
                    mesReferencia: mesAno,
                    escola: escola,
                    servidorId: servidorId,
                    cpf: cpfServidor,
                    diasAfastamento: diasAfastamento,
                    dataAtualizacao: new Date().toISOString()
                }, { merge: true });

                btnOriginal.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span> Salvo!';
                btnOriginal.style.background = "#1b5e20";
            }
            
            setTimeout(() => {
                btnOriginal.innerHTML = textoOriginal;
                btnOriginal.style.background = "";
                carregarDadosDaEscola();
            }, 1200);

        } catch (erro) {
            console.error("Erro ao salvar/remover afastamento:", erro);
            alert("Erro ao atualizar o afastamento. Verifique sua conexão.");
        }
    }

    function mostrarMensagem(texto, tipo) {
        const msg = document.getElementById("mensagem");
        msg.textContent = texto;
        msg.className = "mensagem " + tipo;
    }
</script>

</body>
</html>
Como limpar uma coleção no Firebase? Tô pensando em limpar lá e começar os testes de novo, pra ver se vai dar certo.

Para limpar ou excluir uma coleção inteira no Firebase (Cloud Firestore) para reiniciar os seus testes, a forma mais rápida e prática é fazer diretamente pelo Console do Firebase.

Aqui está o passo a passo:

Método 1: Pelo Console do Firebase (Mais fácil e rápido)
Acesse o Console do Firebase e abra o seu projeto.

No menu lateral esquerdo, clique em Cloud Firestore (na seção Build ou Desenvolver).

Na aba Dados, você verá a lista com todas as suas coleções.

Clique em cima da coleção que você deseja limpar.  
Google

No topo da coluna de documentos (logo acima da lista de registros), clique no ícone de três pontinhos (menu).

Selecione a opção Excluir coleção (Delete collection).  
Google

Uma janela de confirmação vai se abrir pedindo para você redigitar o nome da coleção para confirmar. Faça isso e confirme.

Pronto! Todos os documentos (e subcoleções vinculadas) daquela coleção serão apagados de uma só vez. Depois é só recriar os testes ou deixar que o seu código crie novos documentos limpos conforme você for executando a aplicação.

Método 2: Usando a CLI do Firebase (Para automação ou muitos dados)
Se você preferir usar a linha de comando e já tiver a CLI do Firebase configurada no seu computador, você pode rodar o comando abaixo no terminal:

Bash
firebase firestore:delete nome_da_sua_colecao
(Substitua nome_da_sua_colecao pelo nome real da coleção que quer zerar).

Se eu excluir a coleção, o código aí do JavaScript da tela de de lançamentos, ele vai criar nova coleção? Vai criar novamente, quero dizer.

Sim e não — depende de qual coleção você está apagando, pois o seu código interage com diferentes coleções de formas distintas (algumas ele só lê, outras ele escreve).

Veja o que acontece em cada caso:

1. Coleções onde o código SALVA dados (lancamentos_mensais e escola_configuracoes_mensais)
O que acontece se excluir: Se você apagar essas coleções no Firebase, elas somem.

O código recria? Sim, automaticamente.

Por quê? Quando você clica em "Salvar" na tela (seja salvando os dias úteis da escola ou o afastamento de um servidor), o código usa a função setDoc. No Firestore, o setDoc cria a coleção e o documento na hora se eles não existirem. Portanto, assim que você fizer um novo lançamento de teste, a coleção reaparece sozinha no Firebase.

2. Coleções onde o código apenas LÊ dados (servidores e registro_ferias_folgas)
O que acontece se excluir: Se você apagar a coleção de servidores ou de registro_ferias_folgas, a tabela vai simplesmente ficar vazia ou não vai mostrar nenhum funcionário ao carregar a escola.

O código recria? Não.

Por quê? Essa tela de lançamentos foi feita apenas para consultar os servidores e as férias/folgas que já foram cadastrados (ela usa getDocs para buscar, mas nunca cria novos servidores por aqui). Se você apagar a coleção de servidores inteira, precisará cadastrá-los novamente pelas telas próprias de cadastro de servidores do seu sistema para que eles voltem a aparecer aqui.

Resumo para os seus testes:
Se quiser limpar apenas os lançamentos de faltas/afastamentos antigos para começar do zero: você pode apagar com tranquilidade a coleção lancamentos_mensais. Ela vai se recriar sozinha assim que você salvar o primeiro teste na tela.

Cuidado para não apagar a coleção de servidores, a menos que você realmente queira apagar o cadastro de todos os funcionários da prefeitura/escola do sistema.

Os lançamentos continuam todos lá na coleção lançamentos mensais.

Ah, entendi! Se eles ainda aparecem lá no Console do Firebase, significa que a exclusão da coleção ainda não foi executada ou concluída.

No Console do Firebase, às vezes a gente clica nos documentos de dentro da coleção, mas para apagar a coleção inteira de uma vez só, o caminho exato é este:

No menu lateral do Cloud Firestore, clique na própria palavra lancamentos_mensais na lista de coleções à esquerda.

Quando os documentos aparecerem na coluna do meio, olhe bem no topo daquela coluna (onde mostra o caminho/nome da coleção). Lá em cima vai ter um ícone de três pontinhos.

Clique nesses três pontinhos do topo e selecione Excluir coleção (Delete collection).

O Firebase vai abrir uma caixinha de aviso exigindo que você digite exatamente o nome da coleção (lancamentos_mensais) para confirmar que você tem certeza.

Digite e confirme.

Assim que você fizer isso, a coleção some do mapa. Depois, basta voltar na sua tela, clicar em Carregar Unidade novamente, e a tabela estará totalmente limpa para você começar os testes do zero!

De qualquer forma, mesmo não apagando a coleção, você não criou um novo código na página de lançamentos para excluir os lançamentos anteriores, sobrescrever os anteriores?

Exatamente! O código faz o controle de forma individual por servidor e sobrescreve os dados quando você clica no botão Salvar daquela linha.

Entenda como o código lida com isso:

Como funciona a gravação (setDoc):
O ID de cada documento no banco é gerado usando o mês, a escola e o CPF do servidor (${mesAno}_${escola}_${cpfLimpo}). Isso significa que só existe um registro por servidor em cada mês/escola.

Se você mudar o valor de dias de afastamento na tela e clicar em Salvar, o código sobrescreve o valor antigo no Firebase pelo novo valor.

O caso do zero (deleteDoc):
Se o usuário colocar 0 (ou apagar) e clicar em salvar, o código foi programado para excluir aquele registro específico do banco para não deixar "lixo" (registros com 0 dias).

Por que os lançamentos antigos continuavam lá no Firebase?
Porque a tela não apaga a coleção inteira sozinha quando você clica em "Carregar Unidade". Ela apenas lê o que está gravado no banco para preencher os inputs.

Se você quiser atualizar um valor, basta alterar o número no campo da tela e clicar em "Salvar" na linha daquele servidor (ele vai sobrescrever o anterior).

Se você quiser limpar tudo de uma vez (zerar todos os servidores daquela escola/mês de uma só vez) sem ter que clicar em salvar/excluir um por um, aí sim a melhor forma é ir lá no Console do Firebase e excluir a coleção (ou os documentos), como conversamos antes.

Então, acho que evoluímos muito até aqui o sistema e eu quero agora criar versão 1.2, vai chamar até aqui. E vamos pontuar o que tem até aqui.

Com certeza! O sistema evoluiu muito e já conta com uma estrutura robusta, inteligente e integrada com o Firebase.

Formalizar o marco da Versão 1.2 é excelente para documentar o que já foi conquistado e garantir uma base sólida para os próximos passos.

Veja o resumo completo de tudo o que o sistema possui até esta Versão 1.2:

🚀 Versão 1.2 — Lançamentos e Afastamentos (Vale Transporte / Semed)
1. Interface e Experiência do Usuário (UI/UX)
Layout Moderno e Responsivo: Desenvolvido em HTML5/CSS com variáveis customizadas, suporte a dispositivos móveis e desktop, utilizando fontes Inter e ícones do Google Material Symbols.

Barra Superior Institucional: Contém identificação do sistema, módulo atual (Semed - Gestão de Afastamentos) e um indicador de status de conexão em tempo real com barrinhas de sinal.

Navegação Contextual: Sistema de breadcrumbs (trilha de navegação) para orientar o usuário dentro do painel da escola.

2. Filtros e Controle de Período
Seleção por Mês de Referência: Input interativo para escolher o ano e o mês de apuração (YYYY-MM).

Seleção de Unidade Escolar: Lista suspensa integrada com as escolas da rede (CEAE, CETEPE, E M São José, E M São Geraldo, CMEI Anália Nogueira).

Botão de Carga Dinâmica: Carrega os dados da unidade selecionada sob demanda, ocultando ou exibindo os blocos de acordo com o fluxo de uso.

3. Gestão e Flexibilidade de Dias Úteis
Padrão SEMED: O sistema consulta automaticamente no banco de dados (configuracoes) o calendário-base de dias úteis definido pela administração central para o mês.

Calendário Específico da Escola: Permite que a unidade visualize e altere os dias úteis efetivos da sua própria realidade (ex: caso tenham tido uma semana atípica), salvando a configuração na coleção escola_configuracoes_mensais.

4. Automação Inteligente de Férias e Folgas
Cruzamento de Datas Automático: O sistema lê os registros da coleção registro_ferias_folgas, calcula o intervalo de sobreposição exato dentro do mês de referência e soma automaticamente esses dias ao cômputo de ausências do servidor.

Identificação Visual: Servidores que possuem dias automáticos de férias/folgas recebem uma tag destacada na tabela indicando a origem do afastamento.

5. Lançamento e Gravação Individual de Afastamentos
Listagem Inteligente de Servidores: Busca dinâmica de servidores vinculados à escola (servidores), identificando de forma automática a matrícula correta (Matrícula 1 ou 2) e o cargo correspondente naquela unidade.

Persistência Inteligente no Firebase (lancamentos_mensais):

Salva os dados de forma individual por servidor/mês/escola usando chaves compostas únicas.

Sobrescrita Automática: Se o usuário alterar um valor e clicar em salvar, o sistema sobrescreve o dado anterior.

Limpeza Automática: Se o usuário zerar ou apagar o campo e salvar, o sistema remove o documento do banco (deleteDoc) para evitar registros fantasmas de "zero dias".

Feedback Visual em Tempo Real: O botão exibe estados de "Salvo!" com animação de sucesso após a gravação.

6. Painel de Resumos Estatísticos
Indicadores Agregados: Exibe cartões de resumo logo acima da tabela contendo:GUIA TÉCNICO E ARQUITETURAL — SISTEMA VALE TRANSPORTE (VERSÃO 1.2)
1. Stack Tecnológica
Frontend: HTML5, CSS3 (com variáveis nativas e Flexbox/Grid), JavaScript ES6+ (com Modules via CDN).

Biblioteca de Estilos/Ícones: Google Fonts (Inter) e Google Material Symbols.

Backend / Banco de Dados: Google Firebase (Cloud Firestore v10.8.0).

Autenticação de Conexão: Arquivo centralizador firebase.js.

2. Estrutura do Banco de Dados (Cloud Firestore)
O sistema opera com 5 coleções principais no Firestore. Abaixo está a especificação de cada uma:

Coleção 1: configuracoes
Finalidade: Armazena o calendário-base de dias úteis definido pela SEMED para cada mês.

ID do Documento: YYYY-MM (Ex: 2026-06)

Estrutura dos Campos (JSON):

JSON


{
  "diasUteis": 22
}
Coleção 2: escola_configuracoes_mensais
Finalidade: Armazena exceções ou ajustes de dias úteis feitos por uma escola específica em um determinado mês.

ID do Documento: ${mesAno}_${escola} (Ex: 2026-06_CEAE)

Estrutura dos Campos (JSON):

JSON


{
  "mesReferencia": "2026-06",
  "escola": "CEAE",
  "diasUteisEscola": 20,
  "dataAtualizacao": "2026-06-06T12:00:00.000Z"
}
Coleção 3: servidores
Finalidade: Cadastro central de todos os servidores da rede, contendo dados pessoais, lotações e matrículas.

ID do Documento: Gerado automaticamente pelo Firestore (ou CPF).

Estrutura dos Campos (JSON):

JSON


{
  "nome": "Nome do Servidor",
  "cpf": "000.000.000-00",
  "escolas": ["CEAE", "CETEPE"],
  "matricula1": {
    "numeroMatricula": "12345",
    "cargo": "Professor",
    "escola1": { "nomeEscola": "CEAE" }
  }
}
Coleção 4: registro_ferias_folgas
Finalidade: Armazena os períodos de férias ou folgas programadas dos servidores para cruzamento automático de ausências.

ID do Documento: Gerado automaticamente pelo Firestore.

Estrutura dos Campos (JSON):

JSON


{
  "cpf": "000.000.000-00",
  "dataInicio": "2026-06-10",
  "dataFim": "2026-06-20",
  "tipo": "Férias"
}
Coleção 5: lancamentos_mensais
Finalidade: Armazena os dias de ausência efetivamente lançados (faltas/afastamentos manuais) por servidor, escola e mês.

ID do Documento: ${mesAno}_${escola}_${cpfLimpo} (Ex: 2026-06_CEAE_00000000000)

Estrutura dos Campos (JSON):

JSON


{
  "mesReferencia": "2026-06",
  "escola": "CEAE",
  "servidorId": "id_do_documento_servidor",
  "cpf": "000.000.000-00",
  "diasAfastamento": 3,
  "dataAtualizacao": "2026-06-06T14:30:00.000Z"
}
3. Mapeamento de Páginas do Projeto
O ecossistema do sistema é composto por 4 páginas principais (módulos):

cadastros_servidores.html (Gestão de Pessoal) -> Cria/Edita dados na coleção servidores.

registro_ferias_folgas.html (Controle de Ausências Programadas) -> Cria/Edita dados na coleção registro_ferias_folgas.

configuracoes_semed.html (Calendário Central) -> Cria/Edita dados na coleção configuracoes.

lancamentos_afastamentos.html (A Tela Atual / Módulo de Fechamento) -> Lê de todas as outras coleções e grava em escola_configuracoes_mensais e lancamentos_mensais.

4. Matriz de Relacionamento e Dependências das Páginas
Página Atual (lancamentos_afastamentos.html)	Relação	O que consome / Grava
servidores	Dependência de Leitura	Busca os servidores que possuem a escola atual no array escolas. Sem ela, a tabela fica vazia.
registro_ferias_folgas	Dependência de Leitura	Faz o cruzamento de datas no mês para somar dias de férias automaticamente.
configuracoes	Dependência de Leitura	Puxa o número padrão de dias úteis estipulado pela SEMED para o mês.
escola_configuracoes_mensais	Leitura e Escrita	Lê os dias úteis customizados da escola e permite salvar alterações (setDoc).
lancamentos_mensais	Leitura e Escrita	Lê os afastamentos salvos e grava/deleta (setDoc/deleteDoc) as alterações feitas pelo operador.

Nota: As páginas de Cadastro de Servidores e Férias funcionam de forma independente (são "upstream"), pois alimentam os dados que esta tela consome.

5. Passo a Passo Técnico para Reconstrução do Zero (Setup Guide)
Se você precisar recriar este projeto em um novo ambiente ou repositório, siga esta ordem exata:

Passo 1: Configuração do Projeto no Firebase
Crie um projeto no Console do Firebase.

Ative o Cloud Firestore no modo de produção (ou teste).

Obtenha as credenciais de configuração web do SDK do Firebase.

Passo 2: Criação do Arquivo de Conexão (firebase.js)
Na raiz do seu projeto, crie o arquivo que inicializa o Firebase e exporta a instância do banco:

JavaScript


// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_DOMINIO.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
Passo 3: Criação Estrutural das Coleções (Manual ou Automática)
As coleções (servidores, configuracoes, registro_ferias_folgas, escola_configuracoes_mensais, lancamentos_mensais) não precisam ser criadas manualmente no painel do Firebase, pois o próprio comportamento do SDK do Firestore e das telas cria a coleção no exato momento em que o primeiro documento é inserido (setDoc).

Passo 4: Implementação do Front-end (HTML + JS Modules)
Garanta que todas as páginas utilizem tags <script type="module"> para importar corretamente as funções do Firebase via CDN oficial (10.8.0).

Utilize as chaves compostas estruturadas (ex: ${mesAno}_${escola}_${cpfLimpo}) para garantir que os documentos do Firestore possuam IDs previsíveis e únicos, evitando duplicações e facilitando buscas diretas por doc() em vez de varreduras pesadas com query().

O total de servidores com ausências registradas no mês.

A soma total de dias de ausência computados para a unidade escolar.





