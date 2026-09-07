versão 1.4

Melhorias que  contém nesta versão:
1. Criação do bloqueio dos meses  com opção de configuração na página de configuração da Semed e na página das escolas. Escola só faz lançamentos se o mês estiver aberto 

Melhorias que não contém nesta versão:
importação csv
link para a página de edição 
Campo data de lançamento de férias aceita qualquer tempo de data ex: 18 dias de férias 



_____________________________
-----------------------------
versão 1.3
Melhorias que não contém nesta versão:
importação csv
link para a página de edição 
Campo data de lançamento de férias aceita qualquer tempo de data ex: 18 dias de férias 







primeira mudança página de cálculo responsiva
segunda mudança página da escola responsiva
terceira mudança barra de pesquisa no controle de férias
quarta mudança página de escola mostrava só uma matrícula 
quinta mudança página de cálculos soma férias lançadas mais lançamentos manuais pela escola o lançamento manual estava sobre escrevendo as férias não somava

sexta mudança página de lançamento das escolas mostrava férias lançadas para as duas matrículas do mesmo servidor isso foi corrigido agora ao lançar férias para uma determinada matrícula a página de lançamentos da escola reconhece que é só para uma matrícula mesmo estando na mesma escola 

sétima mudança a mesma história na página de cálculo ao lançar férias para um servidor em uma determinada matrícula a página de cálculo é calculava esse lançamento para as duas matrículas ou seja ele reconhecia pelo CPF agora o cálculo foi atualizado e é por matrícula funcionando normalmente

Quando a escola lança férias, na página de lançamentos, mostra os 30 dias, por exemplo. Aí, no cálculo, mostra também os 30 dias. Mas se a pessoa vai lá e edita, põe 2 dias, por exemplo, aí ele soma 32 dias, mas na página de cálculo, ele mostra só 2. Ou seja, na página de lançamentos fica 32 dias e na página de cálculo, 2 dias.

Esse comportamento ocorre porque há uma divergência entre duas fontes de dados no seu sistema:

A Página de Lançamentos salva/edita os dados na coleção lancamentos_mensais. Ao editar, em vez de substituir o valor anterior (30) pelo novo (2), o sistema está fazendo um acréscimo ou gerando um novo registro acumulado (30 + 2 = 32).

A Página de Cálculo (com o script atualizado) lê diretamente as datas de início e fim da coleção registro_ferias_folgas, calcula a intersecção exata com o mês e encontra os 2 dias corretos, ignorando ou sobrescrevendo o valor duplicado.

Ou seja: o cálculo está correto ao mostrar 2 dias, mas a página de lançamentos está acumulando os valores em vez de atualizá-los.

Como corrigir na Página de Lançamentos
Para que a página de lançamentos exiba os mesmos 2 dias, você precisa garantir que, ao salvar ou editar o lançamento de um servidor em um determinado mês, o sistema utilize um ID único por servidor e mês (por exemplo: MESANO_CPF).

Dessa forma, ao editar, o Firestore fará um set (sobrescrevendo o registro antigo) em vez de adicionar um novo valor somado.

No código da sua página de lançamentos, ao salvar o registro no Firestore, certifique-se de que a gravação usa um ID personalizado em vez de addDoc (que gera IDs aleatórios e duplicados):

❌ Errado (Gera duplicação / acumula):
JavaScript
// Isso cria um documento novo a cada edição, somando 30 + 2
await addDoc(collection(db, "lancamentos_mensais"), {
    cpf: cpfServidor,
    mesReferencia: mesAno,
    diasAfastamento: 2,
    escola: nomeEscola
});
✔️ Correto (Atualiza / Substitui o valor):
JavaScript
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Limpa o CPF para usar no ID
const cpfLimpo = cpfServidor.replace(/\D/g, "");
// Cria um ID único combinando o mês e o CPF (ex: "2026-09_12345678900")
const idUnico = `${mesAno}_${cpfLimpo}`;

// O setDoc com merge: true ou substituição limpa o valor anterior e grava o novo (2 dias)
await setDoc(doc(db, "lancamentos_mensais", idUnico), {
    cpf: cpfServidor,
    mesReferencia: mesAno,
    diasAfastamento: 2,
    escola: nomeEscola
}, { merge: true });
Resumo
Ajustando a página de lançamentos para usar um ID fixo por mês/servidor (setDoc em vez de addDoc), a página de lançamentos passará a mostrar os 2 dias exatos, alinhando-se perfeitamente com a página de cálculo.

O código já está assim.

Se o código de salvamento já utiliza um ID único (setDoc), o motivo de a página de lançamentos mostrar 32 dias e a página de cálculo mostrar 2 dias está em um conflito estrutural: o seu sistema está usando duas coleções diferentes no banco de dados para a mesma coisa.

Isso acontece porque:

Na Página de Lançamentos, o sistema lê e grava na coleção lancamentos_mensais. Se lá houver algum ponto onde os registros se acumulam (ou se a tela de lançamentos faz uma soma local de documentos antigos), ela empilha o valor antigo com o novo (30 + 2 = 32).

Na Página de Cálculo, o script que passei lê as datas de início e fim da coleção registro_ferias_folgas, calcula a intersecção exata do mês e chega ao valor correto de 2 dias, acabando por ignorar ou divergir do que está salvo em lancamentos_mensais.

Em resumo: O cálculo está certo (2 dias), mas a tela de lançamentos está presa a um registro duplicado ou acumulado no banco.

Como resolver isso definitivamente?
Para que as duas páginas mostrem exatamente o mesmo valor, a Página de Lançamentos e a Página de Cálculo precisam consultar exatamente a mesma fonte de dados.

Se as férias são cadastradas por período (Data de Início e Data de Fim), a melhor prática é fazer com que a página de lançamentos também calcule os dias com base nas datas, em vez de salvar um número fixo de dias (30 ou 2) que pode dessincronizar.

Se você quiser que o cálculo ignore completamente a coleção lancamentos_mensais para férias e olhe apenas para o intervalo de datas real (o que garante que nunca haverá divergência e sempre mostrará os 2 dias corretos), basta ajustar o trecho do script de cálculo onde ele lê os lançamentos mensais.

Ajuste no Script de Cálculo
Se na sua página de cálculo você quiser garantir que o sistema confie apenas nas datas reais cadastradas (evitando que dados antigos ou duplicados em lancamentos_mensais atrapalhem), você pode remover ou isolar a leitura de lancamentos_mensais para que ela sirva apenas para Faltas, enquanto as Férias/Folgas usam exclusivamente o cálculo por período de datas.

Se o lançamento de férias é feito inteiramente por data, a coleção lancamentos_mensais acaba se tornando redundante para esse fim. Verifique se na sua Página de Lançamentos o salvamento está gravando na coleção registro_ferias_folgas ou em lancamentos_mensais. Se estiver gravando nas duas ao mesmo tempo, uma delas está ficando desatualizada ao editar.

Calma, vamos com calma, porque futuramente vamos ter que criar uma página de controle de férias, que vai ser a linha de tempo do servidor, então vamos precisar dessas datas.

Você tem toda razão em pensar no futuro! Manter a coleção de datas (registro_ferias_folgas) com início e fim é exatamente o caminho correto para construir a linha do tempo do servidor lá na frente.

O fato de ir para 32 dias (30 + 2) nos dá a resposta exata de onde está o problema: o código da Página de Lançamentos está fazendo uma soma cumulativa (provavelmente lendo o valor antigo do banco, somando o novo valor digitado, ou criando um novo registro em cima do antigo) em vez de recalcular os dias com base nas datas.

Para que a sua base de dados fique limpa, sirva para a futura linha do tempo e nunca mais dê divergência, a melhor prática de arquitetura é adotar o conceito de Única Fonte da Verdade (Single Source of Truth).

Como estruturar isso sem perder a futura Linha do Tempo:
A Base de Dados (registro_ferias_folgas):
Deve armazenar apenas os eventos com suas datas reais:

cpf: "123.456.789-00"

dataInicio: "2026-09-10"

dataFim: "2026-09-11" (os tais 2 dias)

tipo: "Férias" ou "Folga"

O Erro na Página de Lançamentos:
Atualmente, a sua página de lançamentos provavelmente salva um campo de número fixo (diasAfastamento: 30) ou adiciona valores. Quando o usuário edita para 2 dias, o sistema antigo está salvando 30 + 2 ou mantendo o histórico antigo ativo.

A Solução Definitiva:
Tanto a Página de Lançamentos quanto a Página de Cálculo devem usar a mesma lógica matemática para descobrir quantos dias aquela férias/folga gerou no mês de referência.

Em vez de salvar o número "30" ou "2" diretamente como um campo estático de dias, o sistema deve salvar as datas e calcular os dias dinamicamente sempre que precisar exibir.

Ajuste na Página de Lançamentos
Se na página de lançamentos você cadastra a Data de Início e a Data de Fim, o campo de "Dias de Afastamento" não deveria ser digitado manualmente ou somado de forma cega, mas sim calculado na hora com base nas datas, exatamente como fizemos na página de cálculo.

Se você me mostrar um trecho de como a sua Página de Lançamentos salva os dados no Firebase (o evento de salvar/editar), eu consigo te mostrar exatamente qual linha alterar para que ela substitua o período em vez de somar 30 + 2. O que acha?

Deixa eu te explicar primeiro, vamos com calma. Temos três páginas: a de lançamento das escolas, a de lançamento de férias e a que faz o cálculo. Na página de férias, lancei 30 dias para o João. Apareceu automático na pagina das escolas 30 dias com card visual 30 dias férias auto, apareceu também 30 dias na página de cálculo. Até aqui tudo certo. Agora começa o problema, se na página das escolas eu apago o 30 e coloco 2 e monstra 42 corretamente, mas na página de cálculo ele ignora os 30 e só mostra 2, mas na página da escola ao invés de digitar 2 eu digitar 32 e salvar na página cálculo aí sim monstra os 32 corretamente

Agora sim, o cenário ficou cristalino! Esse detalhe explica exatamente onde o sistema está se perdendo.

O conflito acontece porque você tem duas pontas tentando mandar na mesma informação:

A Página de Férias joga os 30 dias automáticos no sistema.

A Página da Escola (Lançamentos) permite que o usuário edite e salve um valor específico (ex: 2 dias) em outra tabela (lancamentos_mensais).

Quando você vai para a Página de Cálculo, ela se confunde: ou ela puxa os 30 dias automáticos das férias, ou o lançamento manual da escola sobrescreve tudo e mostra só 2 (ignorando os 30), ou em alguns casos acaba somando (30 + 2 = 32).

A Regra de Negócio Correta para o Futuro
Para que o sistema funcione perfeitamente com as três páginas (inclusive pensando na futura linha do tempo), a lógica de prioridade deve ser:

O cálculo automático de Férias serve como a base padrão (os 30 dias).

O lançamento manual da Escola funciona como uma exceção/ajuste. Se alguém foi na página da escola e editou manualmente para 2 dias, significa que o lançamento da escola tem prioridade absoluta sobre o automático naquele mês específico.

Ou seja: se a escola mexeu, o sistema deve usar o valor da escola (2 dias) e ignorar o automático de férias daquele mês, em vez de tentar somar ou conflitar.

Como ajustar o Script de Cálculo para respeitar essa hierarquia?
No script da página de cálculo, a ordem de leitura deve ser invertida: primeiro o sistema olha as férias automáticas e, logo depois, verifica se a escola fez algum lançamento manual. Se a escola fez um lançamento manual, esse valor substitui o automático.

Veja como deve ficar a parte de montagem do afastamentosMap no script da página de cálculo:

JavaScript
            // 4. PRIMEIRO: Carrega as Férias e Folgas automáticas como base
            const afastamentosMap = {};
            try {
                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));
                const [anoStr, mesStr] = mesAno.split("-");
                const anoNum = parseInt(anoStr);
                const mesNum = parseInt(mesStr) - 1;
                const primeiroDiaMes = new Date(anoNum, mesNum, 1);
                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);

                feriasSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const cpfRaw = data.cpf || data.cpfServidor || data.servidorCpf || "";
                    const inicioRaw = data.dataInicio || data.inicio || data.dataInicioFerias;
                    const fimRaw = data.dataFim || data.fim || data.dataFimFerias;

                    if (cpfRaw && inicioRaw && fimRaw) {
                        const cpfLimpo = cpfRaw.replace(/\D/g, "");
                        const inicio = parseDate(inicioRaw);
                        const fim = parseDate(fimRaw);

                        if (inicio && fim && !isNaN(inicio) && !isNaN(fim)) {
                            const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));
                            const endOverlap = new Date(Math.min(fim, ultimoDiaMes));

                            if (startOverlap <= endOverlap) {
                                const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;
                                if (diasNoMes > 0) {
                                    // Define a base automática de férias
                                    afastamentosMap[cpfLimpo] = (afastamentosMap[cpfLimpo] || 0) + diasNoMes;
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.log("Aviso: Erro ao calcular intersecção de férias e folgas:", e);
            }

            // 3. SEGUNDO: Lançamentos manuais da escola SOBRESCREVEM o automático se houver edição
            try {
                const lancQuery = query(collection(db, "lancamentos_mensais"), where("mesReferencia", "==", mesAno));
                const lancSnap = await getDocs(lancQuery);
                lancSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const dias = Number(data.diasAfastamento) || 0;
                    if (data.cpf) {
                        const cpfLimpo = data.cpf.replace(/\D/g, "");
                        
                        // Se a escola lançou/editou manualmente, o valor da escola substitui a base automática
                        if (data.escola) {
                            afastamentosMap[`${data.escola}_${cpfLimpo}`] = dias;
                        }
                        afastamentosMap[cpfLimpo] = dias; // Sobrescreve o automático (ex: troca os 30 por 2)
                    }
                });
            } catch (e) {
                console.log("Aviso: Lançamentos mensais não encontrados.");
            }
O que muda com esse ajuste?
Se você lançar 30 dias nas Férias, a página da escola mostra 30 e o cálculo mostra 30.

Se você for na Página da Escola e editar para 2 dias, o sistema salva 2 na tabela de lançamentos mensais. Na hora de calcular, o sistema vê que a escola fez um lançamento manual e substitui os 30 por 2, fazendo o cálculo fechar perfeitamente com 2 dias, sem acumular errado (30 + 2) e sem sumir com a informação da futura linha do tempo (já que as datas reais continuam intactas na coleção de férias).

Já está assim. Na verdade, ele tem que somar. Ele tem que somar os 30 dias de férias, mais dois que a escola lançou manual, totalizando 32 dias na página de cálculo.

Entendi perfeitamente agora! A regra de negócio é uma soma cumulativa: o sistema precisa pegar os 30 dias de férias automáticas e somar com os 2 dias lançados manualmente pela escola, totalizando 32 dias na página de cálculo.

No código anterior, a segunda etapa estava substituindo o valor em vez de somar. Para resolver isso e garantir que o cálculo some as duas pontas (Férias + Lançamentos Manuais da Escola), precisamos usar o operador de soma (+= ou (atual || 0) + novo) em ambas as buscas.

Aqui está o trecho exato do motor de cálculo (na sua Página de Cálculo) que faz essa soma correta. Substitua a parte onde os afastamentos são mapeados por este bloco:

JavaScript
            // 3. INICIALIZA O MAPA DE AFASTAMENTOS
            const afastamentosMap = {};

            // 4. PARTE 1: Carrega as Férias e Folgas automáticas e ADICIONA ao mapa
            try {
                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));
                const [anoStr, mesStr] = mesAno.split("-");
                const anoNum = parseInt(anoStr);
                const mesNum = parseInt(mesStr) - 1;
                const primeiroDiaMes = new Date(anoNum, mesNum, 1);
                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);

                feriasSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const cpfRaw = data.cpf || data.cpfServidor || data.servidorCpf || "";
                    const inicioRaw = data.dataInicio || data.inicio || data.dataInicioFerias;
                    const fimRaw = data.dataFim || data.fim || data.dataFimFerias;

                    if (cpfRaw && inicioRaw && fimRaw) {
                        const cpfLimpo = cpfRaw.replace(/\D/g, "");
                        const inicio = parseDate(inicioRaw);
                        const fim = parseDate(fimRaw);

                        if (inicio && fim && !isNaN(inicio) && !isNaN(fim)) {
                            const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));
                            const endOverlap = new Date(Math.min(fim, ultimoDiaMes));

                            if (startOverlap <= endOverlap) {
                                const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;
                                if (diasNoMes > 0) {
                                    // SOMA os dias de férias à base do servidor
                                    afastamentosMap[cpfLimpo] = (afastamentosMap[cpfLimpo] || 0) + diasNoMes;
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.log("Aviso: Erro ao calcular intersecção de férias e folgas:", e);
            }

            // 5. PARTE 2: Carrega os lançamentos manuais da escola e SOMA junto com as férias
            try {
                const lancQuery = query(collection(db, "lancamentos_mensais"), where("mesReferencia", "==", mesAno));
                const lancSnap = await getDocs(lancQuery);
                lancSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const dias = Number(data.diasAfastamento) || 0;
                    if (data.cpf && dias > 0) {
                        const cpfLimpo = data.cpf.replace(/\D/g, "");
                        
                        if (data.escola) {
                            const chaveEscolaCpf = `${data.escola}_${cpfLimpo}`;
                            afastamentosMap[chaveEscolaCpf] = (afastamentosMap[chaveEscolaCpf] || 0) + dias;
                        }
                        
                        // SOMA os dias manuais da escola aos dias que já vieram das férias (Ex: 30 + 2 = 32)
                        afastamentosMap[cpfLimpo] = (afastamentosMap[cpfLimpo] || 0) + dias;
                    }
                });
            } catch (e) {
                console.log("Aviso: Lançamentos mensais não encontrados.");
            }
O que isso resolve:
Se o servidor tem 30 dias de férias cadastrados na página de férias, o sistema computa 30.

Se a escola foi lá e lançou mais 2 dias manualmente na página de lançamentos, o sistema lê esses 2 dias e soma aos 30 já existentes.

O resultado final na página de cálculo será exatamente 32 dias, mantendo a integridade de ambas as informações para a futura linha do tempo e para o financeiro!

Me dê o código completo já atualizado.

Aqui está o código completo e atualizado da sua página de cálculo.

A lógica foi ajustada para separar a base de Férias Automáticas (registro_ferias_folgas) dos Lançamentos Manuais da Escola (lancamentos_mensais) e somar os dois valores (por exemplo: 30 dias de férias + 2 dias manuais = 32 dias totais), garantindo que nenhuma informação seja perdida ou sobrescrita incorretamente.

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
    overflow-x: hidden;
}

body {
    min-height: 100vh;
    background: var(--background);
    color: var(--text);
}

/* BARRA SUPERIOR */
.topbar {
    width: 100%;
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
    white-space: nowrap;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    flex-shrink: 0;
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
    width: 100%;
    max-width: 1116px;
    margin: 0 auto;
    padding: 32px 16px;
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
    flex-wrap: wrap;
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
    width: 100%;
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
    justify-content: center;
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

.table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    white-space: nowrap;
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

/* MEDIA QUERIES PARA RESPONSIVIDADE */
@media (max-width: 950px) {
    .filter-card {
        flex-direction: column;
        align-items: stretch;
    }
    .summary-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .topbar {
        margin: 8px 12px 0;
        width: calc(100% - 24px);
        padding: 0 12px;
        height: 60px;
    }
    .system-module {
        display: none;
    }
    .system-divider {
        display: none;
    }
    .main {
        padding: 20px 12px;
    }
    .page-header h1 {
        font-size: 20px;
    }
    .filter-card {
        padding: 16px;
    }
    .btn-calcular {
        width: 100%;
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
        <p>Calcula a quantidade de vales considerando o calendário da escola, faltas e o somatório automático de férias e lançamentos manuais.</p>
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
        <div class="table-responsive">
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
        </div>
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

    // Função auxiliar robusta para converter datas do Firestore/Inputs em objetos Date sem fuso horário
    function parseDate(val) {
        if (!val) return null;
        if (typeof val.toDate === 'function') {
            const d = val.toDate();
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        if (val instanceof Date) {
            return new Date(val.getFullYear(), val.getMonth(), val.getDate());
        }
        if (typeof val === 'string') {
            const parts = val.split('T')[0].split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            const d = new Date(val);
            if (!isNaN(d)) {
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            }
        }
        return null;
    }

    // MOTOR DE CÁLCULO INTEGRADO COM SOMATÓRIO DE FÉRIAS E LANÇAMENTOS MANUAIS
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

            // 3. ESTRUTURAS SEPARADAS PARA SOMAR FÉRIAS AUTOMÁTICAS + LANÇAMENTOS MANUAIS
            const feriasMap = {};
            const manualEscolaMap = {};
            const manualGeralMap = {};

            // 3.1. Carrega Férias e Folgas automáticas (Calculadas por período)
            try {
                const feriasSnap = await getDocs(collection(db, "registro_ferias_folgas"));
                const [anoStr, mesStr] = mesAno.split("-");
                const anoNum = parseInt(anoStr);
                const mesNum = parseInt(mesStr) - 1;
                const primeiroDiaMes = new Date(anoNum, mesNum, 1);
                const ultimoDiaMes = new Date(anoNum, mesNum + 1, 0);

                feriasSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const cpfRaw = data.cpf || data.cpfServidor || data.servidorCpf || "";
                    const inicioRaw = data.dataInicio || data.inicio || data.dataInicioFerias;
                    const fimRaw = data.dataFim || data.fim || data.dataFimFerias;

                    if (cpfRaw && inicioRaw && fimRaw) {
                        const cpfLimpo = cpfRaw.replace(/\D/g, "");
                        const inicio = parseDate(inicioRaw);
                        const fim = parseDate(fimRaw);

                        if (inicio && fim && !isNaN(inicio) && !isNaN(fim)) {
                            const startOverlap = new Date(Math.max(inicio, primeiroDiaMes));
                            const endOverlap = new Date(Math.min(fim, ultimoDiaMes));

                            if (startOverlap <= endOverlap) {
                                const diasNoMes = Math.round((endOverlap - startOverlap) / (1000 * 60 * 60 * 24)) + 1;
                                if (diasNoMes > 0) {
                                    feriasMap[cpfLimpo] = (feriasMap[cpfLimpo] || 0) + diasNoMes;
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.log("Aviso: Erro ao calcular intersecção de férias e folgas:", e);
            }

            // 3.2. Carrega Lançamentos Manuais feitos pelas Escolas
            try {
                const lancQuery = query(collection(db, "lancamentos_mensais"), where("mesReferencia", "==", mesAno));
                const lancSnap = await getDocs(lancQuery);
                lancSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const dias = Number(data.diasAfastamento) || 0;
                    if (data.cpf && dias > 0) {
                        const cpfLimpo = data.cpf.replace(/\D/g, "");
                        if (data.escola) {
                            const chaveEscolaCpf = `${data.escola}_${cpfLimpo}`;
                            manualEscolaMap[chaveEscolaCpf] = (manualEscolaMap[chaveEscolaCpf] || 0) + dias;
                        } else {
                            manualGeralMap[cpfLimpo] = (manualGeralMap[cpfLimpo] || 0) + dias;
                        }
                    }
                });
            } catch (e) {
                console.log("Aviso: Lançamentos mensais não encontrados.");
            }

            // 4. Busca os servidores no Firebase
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

            // 5. Processa o cálculo SOMANDO Férias Automáticas + Ajustes Manuais da Escola
            querySnapshot.forEach((doc) => {
                const s = doc.data();
                const cpfLimpo = s.cpf ? s.cpf.replace(/\D/g, "") : "";

                function processarEscola(matriculaNum, cargo, escolaObj) {
                    if (!escolaObj) return;
                    const nomeEscola = escolaObj.nomeEscola;
                    if (!nomeEscola) return;
                    if (escolaSelecionada !== "TODAS" && nomeEscola !== escolaSelecionada) return;

                    // Soma correta: Férias do sistema + Ajuste manual da escola para este vínculo
                    const diasFerias = feriasMap[cpfLimpo] || 0;
                    const chaveEscolaCpf = `${nomeEscola}_${cpfLimpo}`;
                    const diasManual = manualEscolaMap[chaveEscolaCpf] !== undefined ? manualEscolaMap[chaveEscolaCpf] : (manualGeralMap[cpfLimpo] || 0);
                    
                    const diasAfastamento = diasFerias + diasManual;

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

            mostrarMensagem("Cálculo realizado com sucesso!", "sucesso");
            setTimeout(ocultarMensagem, 3000);

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
Deu csrto

Que ótimo! Fico muito feliz que tenha dado certo e que agora o cálculo reflita exatamente o que você precisa (somando as férias automáticas com os lançamentos manuais da escola).

Quando precisar avançar em novas telas, ajustar mais regras de negócio ou começar a estruturar aquela linha do tempo do servidor para o futuro, é só me chamar. Bom trabalho com o sistema!

João tem um CPF e duas matrículas. Na página de lançamentos da escola aparece só uma matrícula para lançar as faltas.

Isso acontece porque a Página de Lançamentos da Escola foi programada originalmente focando apenas na matricula1 do servidor, acabando por ignorar a existência da matricula2.

Como o João tem um único documento de cadastro (com o mesmo CPF), mas possui duas matrículas/vínculos (que podem ser na mesma escola em cargos diferentes ou em escolas distintas), a tela de lançamentos só está enxergando a primeira.

Para corrigir isso, a lógica da Página de Lançamentos precisa ser igual à que usamos na página de cálculo: em vez de olhar apenas para o servidor como um bloco único, ela precisa varrer a matricula1 e a matricula2 separadamente, gerando um card ou linha para cada vínculo que a escola possuir.

Como resolver:
Se você me enviar o código da Página de Lançamentos da Escola aqui, eu ajusto ele imediatamente para você para que:

O João apareça duas vezes na listagem da escola (uma para cada matrícula/vínculo).

O lançamento de faltas/afastamentos de uma matrícula não sobrescreva ou ignore a outra.

Pode colar o código da página de lançamentos aqui para eu adaptar para você!

Lembre que temos que economizar leitura ok?

Perfeito! Economizar leituras no Firestore é fundamental para manter o sistema rápido e dentro do limite (evitando custos ou estouros no plano).

A boa notícia para a sua preocupação com leituras é que não precisaremos de novas consultas ao banco. Como o documento do servidor no Firebase já guarda a matricula1 e a matricula2 juntas, uma única leitura por servidor já traz os dados dos dois vínculos. O ajuste será feito inteiramente na memória do navegador (frontend).

Para corrigirmos a página de lançamentos da escola sem gastar leituras extras, pode enviar o código da página de lançamentos aqui. Vou ajustar para que ela varra as duas matrículas mantendo uma única busca no banco!

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

    overflow-x: hidden;

}



body {

    min-height: 100vh;

    background: var(--background);

    color: var(--text);

}



/* BARRA SUPERIOR */

.topbar {

    width: 100%;

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

    white-space: nowrap;

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

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

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

    flex-shrink: 0;

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

    width: 100%;

    max-width: 1116px;

    margin: 0 auto;

    padding: 32px 16px;

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

    flex-wrap: wrap;

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

    width: 100%;

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

    justify-content: center;

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

    flex-shrink: 0;

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

    justify-content: center;

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



.table-responsive {

    width: 100%;

    overflow-x: auto;

    -webkit-overflow-scrolling: touch;

}



table {

    width: 100%;

    border-collapse: collapse;

    text-align: left;

    white-space: nowrap;

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



/* MEDIA QUERIES PARA RESPONSIVIDADE */

@media (max-width: 950px) {

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

}



@media (max-width: 768px) {

    .topbar {

        margin: 8px 12px 0;

        width: calc(100% - 24px);

        padding: 0 12px;

        height: 60px;

    }

    .system-module {

        display: none;

    }

    .system-divider {

        display: none;

    }

    .main {

        padding: 20px 12px;

    }

    .page-header h1 {

        font-size: 20px;

    }

    .filter-card, .school-config-card {

        padding: 16px;

    }

    .btn-carregar {

        width: 100%;

    }

    .school-config-action {

        width: 100%;

        flex-direction: column;

    }

    .input-dias-escola {

        width: 100%;

    }

    .btn-salvar-dias {

        width: 100%;

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

        <div class="table-responsive">

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

        </div>

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

                await deleteDoc(lancRef);

                btnOriginal.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span> Removido!';

                btnOriginal.style.background = "#c62828";

            } else {

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

Aqui está o código completo e atualizado da Página de Lançamentos.

A lógica foi ajustada para que o sistema verifique tanto a matricula1 quanto a matricula2 do servidor. Se um servidor (como o João) possuir vínculos/matrículas ativos na mesma escola, ambas aparecerão como linhas separadas na tabela para que você possa lançar as faltas ou afastamentos de forma independente para cada cargo/matrícula, sem sobrescrever um ao outro.

Além disso, mantivemos a compatibilidade total com lançamentos salvos anteriormente.

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
    overflow-x: hidden;
}

body {
    min-height: 100vh;
    background: var(--background);
    color: var(--text);
}

/* BARRA SUPERIOR */
.topbar {
    width: 100%;
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
    white-space: nowrap;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    flex-shrink: 0;
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
    width: 100%;
    max-width: 1116px;
    margin: 0 auto;
    padding: 32px 16px;
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
    flex-wrap: wrap;
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
    width: 100%;
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
    justify-content: center;
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
    flex-shrink: 0;
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
    justify-content: center;
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

.table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    white-space: nowrap;
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

/* MEDIA QUERIES PARA RESPONSIVIDADE */
@media (max-width: 950px) {
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
}

@media (max-width: 768px) {
    .topbar {
        margin: 8px 12px 0;
        width: calc(100% - 24px);
        padding: 0 12px;
        height: 60px;
    }
    .system-module {
        display: none;
    }
    .system-divider {
        display: none;
    }
    .main {
        padding: 20px 12px;
    }
    .page-header h1 {
        font-size: 20px;
    }
    .filter-card, .school-config-card {
        padding: 16px;
    }
    .btn-carregar {
        width: 100%;
    }
    .school-config-action {
        width: 100%;
        flex-direction: column;
    }
    .input-dias-escola {
        width: 100%;
    }
    .btn-salvar-dias {
        width: 100%;
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
            <label>Vínculos com Ausência no Mês</label>
            <p id="sumComAfastamento">0 vínculos</p>
        </div>
        <div class="summary-box">
            <label>Total de Dias de Ausência Registrados</label>
            <p id="sumTotalDias">0 dias</p>
        </div>
    </section>

    <section id="tableCard" class="table-card">
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Servidor</th>
                        <th>CPF</th>
                        <th>Vínculo / Matrícula / Cargo / Lotação</th>
                        <th>Dias de Ausência (Faltas / Férias / Folgas)</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody id="tabelaCorpo">
                </tbody>
            </table>
        </div>
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
                    const cpfRaw = data.cpf || data.cpfServidor || data.servidorCpf || "";
                    const inicioRaw = data.dataInicio || data.inicio || data.dataInicioFerias;
                    const fimRaw = data.dataFim || data.fim || data.dataFimFerias;

                    if (cpfRaw && inicioRaw && fimRaw) {
                        const cpfLimpo = cpfRaw.replace(/\D/g, "");
                        const inicio = new Date(inicioRaw + "T00:00:00");
                        const fim = new Date(fimRaw + "T00:00:00");

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
            let vinculosComFalta = 0;
            let somaTotalDias = 0;

            for (const servidorDoc of querySnapshot.docs) {
                const s = servidorDoc.data();
                const servidorId = servidorDoc.id;
                const cpfLimpo = s.cpf ? s.cpf.replace(/\D/g, "") : "";

                // Função interna para avaliar cada matrícula/vínculo do servidor na escola selecionada
                async function avaliarVinculo(matriculaObj, tipoMatriculaStr) {
                    if (!matriculaObj) return;
                    const numeroMatricula = matriculaObj.numeroMatricula || "";
                    const cargo = matriculaObj.cargo || "";

                    // Verifica escola1 e escola2 de forma independente
                    const escolasDoVinculo = [matriculaObj.escola1, matriculaObj.escola2];

                    for (const escolaObj of escolasDoVinculo) {
                        if (escolaObj && escolaObj.nomeEscola === escola) {
                            const matriculaInfo = `${tipoMatriculaStr}: ${numeroMatricula} (${cargo}) — ${escolaObj.nomeEscola}`;
                            
                            // Busca manual por matrícula específica (mantendo compatibilidade com o formato antigo)
                            const lancamentoIdNew = `${mesAno}_${escola}_${cpfLimpo}_${numeroMatricula}`;
                            const lancamentoIdOld = `${mesAno}_${escola}_${cpfLimpo}`;
                            
                            let lancRef = doc(db, "lancamentos_mensais", lancamentoIdNew);
                            let lancSnap = await getDoc(lancRef);
                            
                            if (!lancSnap.exists()) {
                                const lancRefOld = doc(db, "lancamentos_mensais", lancamentoIdOld);
                                const lancSnapOld = await getDoc(lancRefOld);
                                if (lancSnapOld.exists()) {
                                    lancSnap = lancSnapOld;
                                    lancRef = lancRefOld;
                                }
                            }
                            
                            const diasSalvosManual = lancSnap.exists() ? (Number(lancSnap.data().diasAfastamento) || 0) : 0;
                            const diasFeriasAuto = feriasMap[cpfLimpo] || 0;
                            const diasTotalExibido = diasSalvosManual + diasFeriasAuto;

                            if (diasTotalExibido > 0) {
                                vinculosComFalta++;
                                somaTotalDias += diasTotalExibido;
                            }

                            const badgeHtml = diasSalvosManual > 0 
                                ? `<span class="badge-salvo"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Salvo</span>` 
                                : (diasFeriasAuto > 0 ? `<span class="badge-salvo" style="background:#fff3e0; color:#e65100; border-color:#ffe0b2;"><span class="material-symbols-outlined" style="font-size: 14px;">event</span> Férias/Folga Auto</span>` : ``);

                            const inputId = `afastamento_${servidorId}_${numeroMatricula}`;

                            linhasTabela += `
                                <tr>
                                    <td><b>${s.nome}</b></td>
                                    <td>${s.cpf}</td>
                                    <td>${matriculaInfo}</td>
                                    <td>
                                        <input type="number" id="${inputId}" class="input-afastamento" value="${diasTotalExibido}" min="0" max="31" inputmode="numeric">
                                        ${badgeHtml}
                                    </td>
                                    <td>
                                        <button type="button" class="btn-salvar-linha" onclick="salvarAfastamento('${mesAno}', '${escola}', '${s.cpf}', '${servidorId}', '${numeroMatricula}')">
                                            <span class="material-symbols-outlined" style="font-size: 16px;">save</span> Salvar
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }
                    }
                }

                if (s.matricula1) {
                    await avaliarVinculo(s.matricula1, "Matrícula 1");
                }
                if (s.matricula2) {
                    await avaliarVinculo(s.matricula2, "Matrícula 2");
                }
            }

            document.getElementById("sumComAfastamento").textContent = vinculosComFalta + " vínculos";
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

    window.salvarAfastamento = async function(mesAno, escola, cpfServidor, servidorId, numeroMatricula) {
        const inputDias = document.getElementById(`afastamento_${servidorId}_${numeroMatricula}`);
        const diasAfastamento = Number(inputDias.value) || 0;
        const cpfLimpo = cpfServidor.replace(/\D/g, "");
        const lancamentoId = `${mesAno}_${escola}_${cpfLimpo}_${numeroMatricula}`;
        const lancRef = doc(db, "lancamentos_mensais", lancamentoId);

        try {
            const btnOriginal = inputDias.parentElement.nextElementSibling.querySelector("button");
            const textoOriginal = btnOriginal.innerHTML;

            if (diasAfastamento <= 0) {
                await deleteDoc(lancRef);
                btnOriginal.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span> Removido!';
                btnOriginal.style.background = "#c62828";
            } else {
                await setDoc(lancRef, {
                    mesReferencia: mesAno,
                    escola: escola,
                    servidorId: servidorId,
                    cpf: cpfServidor,
                    numeroMatricula: numeroMatricula,
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
Qual coleção usa a tela de cálculo, a tela de lançamentos e a tela controle de férias?

No ecossistema do sistema de Vale Transporte, as telas interagem com as seguintes coleções principais no Firebase Firestore:

1. Tela de Lançamentos
Esta tela faz leitura e gravação em várias coleções para cruzar dados de servidores, calendários e faltas:

lancamentos_mensais: É a coleção principal onde ficam salvos os dias de afastamento/faltas lançados manualmente para cada matrícula (id composto por mês, escola, CPF e número da matrícula).

servidores: Utilizada para listar os servidores vinculados à escola selecionada, exibindo suas respectivas matrículas (Matrícula 1 e Matrícula 2), cargos e CPFs.

registro_ferias_folgas: Consultada em tempo de execução para verificar se o servidor possui períodos de férias ou folgas cadastrados no mês, somando-os automaticamente aos dias de ausência.

escola_configuracoes_mensais e configuracoes: Usadas para ler e salvar os dias úteis específicos definidos pela unidade escolar ou o padrão geral da SEMED.

2. Tela de Controle de Férias
registro_ferias_folgas: Coleção dedicada exclusivamente a armazenar os registros de afastamento programado (início e fim de férias ou folgas) vinculados ao CPF do servidor.

servidores: Utilizada para validar o cadastro e localizar o servidor ao registrar um período de férias.

3. Tela de Cálculo
A tela de cálculo de vale transporte processa os dados consolidados do mês e consome informações de praticamente todas as bases anteriores para gerar o resultado final:

servidores: Utilizada para obter os dados cadastrais, rotas e quantidade de passes diários necessários por servidor/vínculo.

lancamentos_mensais: Lê os dias de faltas/afastamentos manuais para realizar os descontos proporcionais.

registro_ferias_folgas: Lê os dias de férias para também descontar no total de dias úteis em que o servidor precisou de transporte.

escola_configuracoes_mensais / configuracoes: Fornece o total de dias úteis do mês (base de cálculo para a proporcionalidade do benefício).

calculos_mensais (ou coleções de fechamento equivalentes, dependendo do módulo): Utilizada caso o sistema salve o resultado final processado de cada folha/cálculo gerado para consulta ou exportação posterior.
