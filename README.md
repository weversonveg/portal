
CRONOGRAMA OFICIAL - SISTEMA VALE TRANSPORTE 
=====================================================

1. Estrutura Base e Layout da Tela de Cadastro
   [X]
    1.1 Criação do HTML e estilos visuais (cores, fontes e layout responsivo).
   [X]
    1.2 Campos obrigatórios e estrutura do formulário de novos servidores.
   [X] 1.3 Integração dos componentes visuais modernos (calendário Flatpickr).
   [X] 1.4 Máscaras de formatação automática para CPF e Telefone.

3. Regras de Negócio e Validações no Cadastro
   [X] 2.1 Validação básica de campos preenchidos e tamanhos exatos.
   [X] 2.2 Conexão inicial com o Firebase Firestore.
   [X] 2.3 Tratamento do botão de salvamento e limpeza automática do formulário.
   [X] 2.4 Validação de CPF Duplicado em tempo real (onblur) com destaque visual e bloqueio.Pesquisando no cache do navegador carrega todos os CPF no primeiro acesso, conta apenas uma leitura, menos tentando vários CPFs inválidos.

4. Formulário Completo, Painel de Gestão e Conectividade
   [ ] 3.1 Inclusão dos novos campos complementares no formulário de cadastro.
   [ ] 3.2 Criação da Tela de Listagem e Painel de Gestão dos Servidores.
   [ ] 3.3 Funcionalidades de Edição e Exclusão de registros.
   [ ] 3.4 Implementação da Importação por CSV.
   [ ] 3.5 Criação do indicador visual de status Online/Offline na interface.

5. Módulos Avançados (Férias, Aniversários e Linha do Tempo)
   [ ] 4.1 Estruturação e campos de controle de Férias dos servidores.
   [ ] 4.2 Implementação do sistema de alerta/controle de Folga Aniversário.
   [ ] 4.3 Desenvolvimento do módulo de Linha do Tempo (Histórico do Servidor).
=====================================================
Estamos retomando o projeto. Nosso último ponto concluído foi o item X.X."




=====================================================================
ESTRUTURA DEFINITIVA DO SISTEMA E FORMULÁRIO DE SERVIDORES (SEMED)
=====================================================================

1. DOCUMENTO PRINCIPAL (Dados Pessoais e Fixos)
   - Nome completo
   - CPF (com validação em tempo real e máscara)
   - E-mail
   - Data de Nascimento
   - Telefone
   - Endereço residencial completo

2. SUBCOLEÇÃO / DADOS DINÂMICOS, VÍNCULOS E BENEFÍCIOS (Por Servidor)
   - Matrícula Principal e botão dinâmico para "Adicionar segunda matrícula" (suporte a acúmulo de cargos)
   - Tipo de Vínculo: [Efetivo | Contratado | Comissionado | Estagiário | Terceirizado]
   - Lotação: Select fixo no HTML contendo a SEMED, Cemed e as 50 escolas da rede
   - Vale-Transporte: Necessidade (Sim/Não), seleção de empresas/linhas baseadas nas tarifas cadastradas, com cálculo automático de passagens e valores unitários
   - Vale-Refeição: [Sim / Não]

3. MÓDULO DE GESTÃO DE EMPRESAS DE ÔNIBUS (Painel Administrativo)
   - Nova Página / Tela "Empresas": Interface exclusiva para a Secretaria Central cadastrar, editar e excluir as empresas de transporte, suas respectivas linhas e os valores unitários das passagens.
   - Subcoleção / Coleção no Firestore ("empresas_tarifas"): Banco de dados dedicado onde ficam armazenados de forma centralizada os registros de cada empresa e seus respectivos custos por passagem, permitindo atualização global imediata sempre que houver reajuste tarifário.

4. DIRETRIZES DE OTIMIZAÇÃO E ARQUITETURA DE CUSTOS
   - Escolas da Rede: Hardcoded diretamente no código HTML para garantir custo zero de leitura no Firestore, carregamento instantâneo e manutenção simples via código caso ocorra alguma alteração na rede municipal.
   - Empresas de Ônibus e Tarifas: Gerenciadas a partir da nova coleção/página dedicada, carregadas de forma otimizada (via cache local ou array controlado) para permitir que a Secretaria Central atualize valores facilmente sem comprometer o orçamento de leituras do banco de dados.
====================================================================


