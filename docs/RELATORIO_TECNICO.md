# Relatório Técnico — Sorteio de Salas · CIC Unesp

| Campo | Informação |
| --- | --- |
| **Produto** | Sorteio de Salas · CIC Unesp |
| **Versão** | 1.0.0 |
| **Desenvolvedor responsável** | Luiz Cláudio Chiavini Oliveira Júnior |
| **Instituição** | Universidade Estadual Paulista "Júlio de Mesquita Filho" — Unesp |
| **Evento-alvo** | Congresso de Iniciação Científica e Tecnológica da Unesp (CIC) |
| **Data do relatório** | 14 de setembro de 2026 |
| **Repositório** | https://github.com/ChiaviniK/sorteio-salas-cic |
| **Aplicação em produção** | https://chiavinik.github.io/sorteio-salas-cic/ |
| **Infraestrutura** | Hospedagem estática gratuita (GitHub Pages), custo zero |

---

## 1. Resumo executivo

O **Sorteio de Salas · CIC Unesp** é uma aplicação web que automatiza a distribuição de
trabalhos científicos e avaliadores em salas de apresentação do Congresso de Iniciação
Científica e Tecnológica da Unesp. O sistema substitui um processo manual, sujeito a erros e
a conflitos de interesse, por um sorteio determinístico, auditável e reprodutível, que aplica
as regras do congresso de forma automática e permite ajuste fino manual com validação em
tempo real.

Todo o processamento ocorre exclusivamente no navegador do organizador — nenhum dado pessoal
é transmitido ou armazenado em servidores — o que garante aderência à Lei Geral de Proteção
de Dados (LGPD, Lei nº 13.709/2018) e elimina custos de infraestrutura.

A versão 1.0.0 foi verificada com os dados reais do XXXVIII CIC (recorte do câmpus de
Registro/FCAVR): 59 trabalhos e 30 avaliadores foram distribuídos em 6 salas sem nenhuma
violação de regra rígida, em tempo de execução inferior a 1 segundo.

## 2. Contexto e justificativa

O CIC recebe as submissões de trabalhos por meio da plataforma Even3, que exporta uma
planilha extensa e sem padronização voltada à logística do evento. A lista de avaliadores,
por sua vez, era mantida em documento de texto livre, sem estrutura. A montagem das salas era
feita manualmente, o que gerava:

- **Risco de conflito de interesse:** orientadores podiam ser designados para avaliar salas
  que continham trabalhos de seus próprios orientandos;
- **Desequilíbrio:** salas com quantidades desiguais de trabalhos e avaliadores, ou sem
  nenhum docente na banca;
- **Concentração:** vários trabalhos de um mesmo orientador na mesma sala;
- **Retrabalho e lentidão:** horas de conferência cruzada entre listas com grafias de nomes
  divergentes (ex.: "Hugo Bendini" × "Hugo do Nascimento Bendini");
- **Ausência de auditabilidade:** impossibilidade de reproduzir ou justificar o resultado
  de uma alocação.

## 3. Objetivos

**Objetivo geral:** automatizar a distribuição de trabalhos e avaliadores em salas do CIC,
garantindo imparcialidade, equilíbrio, rastreabilidade e privacidade.

**Objetivos específicos:**

- Padronizar a entrada de dados por meio de templates de planilha (trabalhos e avaliadores);
- Importar diretamente a exportação da plataforma Even3, sem edição prévia;
- Aplicar automaticamente as regras de negócio do congresso (seção 5);
- Detectar conflitos de interesse mesmo com grafias divergentes de nomes;
- Permitir ajuste manual pós-sorteio com revalidação imediata das regras;
- Registrar uma semente de aleatoriedade que torne o sorteio reprodutível e auditável;
- Exportar o resultado em formatos operacionais (Excel e impressão por sala).

## 4. Escopo funcional

| Código | Requisito funcional |
| --- | --- |
| RF01 | Disponibilizar templates padronizados de Trabalhos e de Avaliadores (.xlsx) para download |
| RF02 | Importar planilha de trabalhos no formato do template ou no formato de exportação do Even3, com detecção automática do formato |
| RF03 | Na importação Even3, derivar a categoria da coluna "programa/agência" e o orientador como último autor, com alerta para conferência |
| RF04 | Importar planilha de avaliadores com nome, e-mail, função (Docente/Pós-graduando/Externo), tipo (Geral/PIBIC Jr) e instituição |
| RF05 | Exibir prévia dos dados importados com estatísticas e alertas de inconsistência |
| RF06 | Parametrizar o sorteio: trabalhos por sala (X), avaliadores por sala (Y), PIBIC Jr junto ou separado e quantidade de salas PIBIC Jr |
| RF07 | Exibir prévia de dimensionamento (salas, avaliadores necessários × disponíveis, docentes) com alertas antes do sorteio |
| RF08 | Executar o sorteio conforme as regras de negócio e exibir o resultado em cartões por sala |
| RF09 | Sinalizar pendências em três níveis (conflito, recomendação, informação) e permitir mover trabalhos/avaliadores entre salas com revalidação em tempo real |
| RF10 | Exportar o resultado em Excel (resumo, trabalhos por sala, avaliadores por sala) e gerar versão de impressão com uma sala por página |

## 5. Regras de negócio

As regras classificam-se em **rígidas** (o sorteio jamais as viola; ajustes manuais que as
violem são sinalizados como conflito), **flexíveis** (o sorteio as busca; violações
inevitáveis são alocadas com aviso) e **informativas**.

| Código | Tipo | Regra | Tratamento |
| --- | --- | --- | --- |
| RN01 | Rígida | Cada sala comporta no máximo X trabalhos, com X definido antes do sorteio | Dimensionamento automático do número de salas |
| RN02 | Rígida | Cada sala recebe Y avaliadores, com Y definido antes do sorteio | Preenchimento equilibrado; falta de avaliadores gera aviso |
| RN03 | Rígida | Avaliador que é orientador oficial de um trabalho não pode avaliar a sala que contém esse trabalho | O alocador exclui o avaliador do conjunto de candidatos da sala; ajuste manual violador é marcado como conflito |
| RN04 | Rígida | Toda sala com trabalhos deve ter ao menos um docente entre os avaliadores | Fase dedicada do algoritmo; impossibilidade gera conflito sinalizado |
| RN05 | Rígida | Existem duas categorias de trabalho: Geral e PIBIC Jr; por padrão ocupam salas separadas, com opção explícita de unificação e quantidade de salas PIBIC Jr definida pelo organizador | Interruptor na interface (padrão: separado) |
| RN06 | Rígida | Salas PIBIC Jr recebem prioritariamente avaliadores do tipo PIBIC Jr; se insuficientes, são completadas com avaliadores gerais | Ordem de prioridade no alocador; avaliadores PIBIC Jr remanescentes podem avaliar salas gerais |
| RN07 | Flexível | Trabalhos de um mesmo orientador devem ser pulverizados em salas distintas | Minimização no critério de escolha de sala; repetição inevitável gera aviso |
| RN08 | Flexível | Avaliador coautor de um trabalho (inclui orientadores não oficiais) deve ser evitado na sala desse trabalho | Penalização no critério de escolha; alocação inevitável ou manual gera aviso |
| RN09 | Flexível | Ocupação equilibrada: a diferença de trabalhos entre salas do mesmo grupo não excede 1 | Capacidades balanceadas calculadas a priori (seção 7.2) |
| RN10 | Rígida | O sorteio é reprodutível: mesma semente e mesmos dados produzem exatamente o mesmo resultado | Gerador pseudoaleatório determinístico com semente registrada |
| RN11 | Rígida | Nenhum dado pessoal sai do navegador do organizador | Arquitetura 100% client-side, sem backend |
| RN12 | Informativa | Trabalho sem categoria é tratado como Geral; trabalho sem orientador identificado gera alerta | Alertas na importação |

## 6. Arquitetura e tecnologias

### 6.1 Visão geral

A aplicação é uma SPA (Single-Page Application) integralmente executada no navegador,
publicada como arquivos estáticos. O fluxo operacional tem três etapas:

- **Etapa 1 — Dados:** download dos templates e importação das duas planilhas, com prévia e alertas;
- **Etapa 2 — Parâmetros:** definição de X, Y, tratamento do PIBIC Jr e semente, com prévia de dimensionamento;
- **Etapa 3 — Resultado:** sorteio, painel de pendências, ajuste manual validado e exportações.

### 6.2 Pilha tecnológica

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Interface | React 19 + TypeScript 6 | Tipagem estática nas regras de negócio; ecossistema consolidado |
| Estilo | Tailwind CSS 4 | Identidade visual Unesp (azul institucional, fonte Raleway) com custo de manutenção baixo |
| Empacotamento | Vite 8 | Build estático com caminhos relativos, publicável em qualquer hospedagem |
| Planilhas | SheetJS CE 0.20.3 | Leitura/escrita de .xlsx diretamente no navegador, sem servidor |
| Hospedagem | GitHub Pages | Custo zero, HTTPS nativo, publicação via branch gh-pages |

### 6.3 Módulos principais

| Módulo | Responsabilidade |
| --- | --- |
| src/lib/sorteio.ts | Motor do sorteio: dimensionamento, distribuição de trabalhos, alocação de avaliadores e validação contínua |
| src/lib/planilhas.ts | Importação (template e Even3), geração de templates e exportação de resultados em .xlsx |
| src/lib/nomes.ts | Normalização e comparação tolerante de nomes (identidade nominal, seção 7.6) |
| src/lib/rng.ts | Aleatoriedade determinística: hash de semente, gerador mulberry32 e embaralhamento Fisher–Yates |
| src/components/ | Interface das três etapas, cartões de sala, menus de movimentação e área de impressão |
| scripts/testar-sorteio.ts | Suíte de verificação de ponta a ponta com os dados reais do congresso |

## 7. Formalização matemática

### 7.1 Notação

- T = conjunto de trabalhos, com N = |T|; particionado em T_G (Geral) e T_J (PIBIC Jr), com N_G = |T_G| e N_J = |T_J|;
- A = conjunto de avaliadores; D ⊆ A é o subconjunto de docentes;
- S = conjunto de salas; X = capacidade de trabalhos por sala; Y = avaliadores por sala;
- or(t) = orientador oficial do trabalho t; aut(t) = conjunto de autores de t;
- σ : T → S é a atribuição de trabalhos; α : A → S ∪ {∅} é a atribuição de avaliadores (∅ = reserva).

### 7.2 Dimensionamento e balanceamento

Com PIBIC Jr em salas separadas, o número de salas gerais é:

> S_G = ⌈N_G / X⌉

e o número de salas PIBIC Jr, S_J, é parâmetro do organizador, validado contra a capacidade:

> S_J · X ≥ N_J   (recomendação sugerida na interface: S_J = ⌈N_J / X⌉)

Com categorias unificadas, S = ⌈N / X⌉. Dentro de um grupo com n trabalhos e k salas, a
capacidade balanceada da i-ésima sala (i = 1, …, k) é:

> cap_i = ⌊n/k⌋ + 1, se i ≤ (n mod k);  cap_i = ⌊n/k⌋, caso contrário

Propriedades: Σ cap_i = n e |cap_i − cap_j| ≤ 1 para quaisquer i, j — o que realiza a RN09
por construção. Exemplo real: n = 59, X = 10 ⇒ 5 salas gerais (10, 10, 10, 10, 10) e 1 sala
PIBIC Jr (9).

O total de avaliadores demandado é A_req = |S| · Y, verificado contra |A| na prévia; a RN04
exige ainda |D| ≥ |S|.

### 7.3 Restrições rígidas

O sorteio produz (σ, α) tais que, para toda sala s com σ⁻¹(s) ≠ ∅:

1. |σ⁻¹(s)| = cap_s — capacidade balanceada (RN01/RN09);
2. α(a) = s ⇒ não existe t ∈ σ⁻¹(s) com or(t) ≡ a — orientador nunca avalia a própria sala (RN03), em que ≡ é a relação de identidade nominal da seção 7.6;
3. |α⁻¹(s)| ≤ Y e cada avaliador é alocado a no máximo uma sala (RN02);
4. existe a ∈ α⁻¹(s) com função(a) = docente (RN04);
5. com separação ativa, cat(t) = tipo da sala σ(t) para todo t (RN05).

### 7.4 Objetivos flexíveis

Sujeito às restrições acima, o algoritmo minimiza, em ordem lexicográfica:

- (i) Σ_s Σ_o max(0, m_{o,s} − 1), onde m_{o,s} = |{t ∈ σ⁻¹(s) : or(t) = o}| — concentração de orientador (RN07);
- (ii) |{(a, s) : α(a) = s e existe t ∈ σ⁻¹(s) com a ∈ aut(t) \ {or(t)}}| — coautorias na banca (RN08);
- (iii) desvio de preferência de tipo (avaliador PIBIC Jr em sala PIBIC Jr — RN06).

O problema combinado é uma variante de **atribuição com restrições de incompatibilidade**,
aparentada a problemas clássicos de empacotamento com conflitos e de emparelhamento bipartido
com listas — intratáveis no caso geral. Dado o porte das instâncias do CIC (dezenas a poucas
centenas de itens), adotou-se uma **heurística gulosa determinística** que garante as
restrições rígidas por construção e trata os objetivos flexíveis como critérios de
desempate, com resultado computado em tempo polinomial de baixa ordem (inferior a 10 ms para
a instância real de 59 × 30).

### 7.5 Aleatoriedade determinística e reprodutibilidade

A semente textual informada pelo organizador é convertida em estado inicial por uma função
de hash iterativa (variante de xmur3):

> h₀ = 1779033703 ⊕ |s|;  h ← rotl₁₃(h ⊕ cᵢ · 3432918353), para cada caractere cᵢ

O estado alimenta o gerador **mulberry32**, com recorrência sobre inteiros de 32 bits:

> a ← a + 0x6D2B79F5 (mod 2³²);  t ← (a ⊕ (a ≫ 15)) · (a | 1);
> t ← t ⊕ (t + (t ⊕ (t ≫ 7)) · (t | 61));  saída = (t ⊕ (t ≫ 14)) / 2³²

produzindo valores uniformes em [0, 1) com período da ordem de 2³² — mais que suficiente
para o volume de decisões do sorteio. Os embaralhamentos usam **Fisher–Yates**: para
i = n−1, …, 1, sorteia-se j uniforme em {0, …, i} e trocam-se as posições i e j. O método é
imparcial: cada uma das n! permutações ocorre com probabilidade exatamente 1/n!.

Consequência (RN10): fixados os arquivos de entrada, os parâmetros e a semente, o resultado
é idêntico em qualquer execução, em qualquer máquina — propriedade verificada na suíte de
testes.

### 7.6 Identidade nominal (comparação de nomes)

Listas reais grafam a mesma pessoa de formas distintas. Define-se a normalização η(nome):
decomposição Unicode NFD; remoção de diacríticos (U+0300–U+036F); caixa baixa; remoção de
pontuação; e descarte das partículas {de, da, do, das, dos, e}. Sejam T_a e T_b as sequências
de tokens normalizados de dois nomes. Vale a ≡ b se, e somente se:

- concat(T_a) = concat(T_b) — absorve falhas de espaçamento (ex.: "MendonçaCarvalho"); ou
- min(|T_a|, |T_b|) ≥ 2, T_menor ⊆ T_maior e primeiro token igual — absorve abreviações.

Exemplos reais validados: "Hugo Bendini" ≡ "Hugo do Nascimento Bendini";
"Ana Letícia Sanches" ≡ "Ana Letícia Madeira Sanches"; "Alex MendonçaCarvalho" ≡
"Alex Mendonça de Carvalho". Quando ambos os registros possuem e-mail, a igualdade exata de
e-mails (caixa-insensível) tem precedência sobre a comparação nominal.

### 7.7 Limite inferior de concentração (princípio da casa dos pombos)

Se um orientador possui m trabalhos em um grupo distribuído em k salas, o máximo de
trabalhos dele em uma mesma sala é necessariamente:

> max_s m_{o,s} ≥ ⌈m/k⌉

O sistema emite aviso sempre que ⌈m/k⌉ ≥ 2, distinguindo violações evitáveis de inevitáveis.
Caso real: um orientador com m = 2 trabalhos PIBIC Jr e k = 1 sala PIBIC Jr implica
⌈2/1⌉ = 2, ou seja, a repetição é matematicamente inevitável e é reportada como aviso, não
como erro.

## 8. Algoritmo do sorteio

### 8.1 Etapa 1 — distribuição de trabalhos

```
agrupar os trabalhos por orientador (chave normalizada η)
embaralhar os grupos (Fisher–Yates) e ordenar por tamanho decrescente
  (ordenação estável preserva a ordem aleatória entre grupos de mesmo tamanho)
para cada grupo, do maior para o menor:
    para cada trabalho t do grupo (em ordem embaralhada):
        C ← salas com vaga (ocupação < cap_i); se C = vazio, C ← todas as salas
        escolher s em C que minimize, lexicograficamente:
            (nº de trabalhos do mesmo orientador já em s, ocupação de s)
            com empates decididos pela ordem aleatória de C
        σ(t) ← s
```

Processar os maiores grupos primeiro — estratégia análoga ao *First-Fit Decreasing* do
empacotamento — maximiza a pulverização: quando as salas ainda têm vagas em quantidade
suficiente, cada trabalho de um mesmo orientador cai em uma sala diferente, atingindo o
limite inferior da seção 7.7. Complexidade: O(N · |S|).

### 8.2 Etapa 2 — alocação de avaliadores

```
fila ← embaralhar(A);  ordenar as salas com PIBIC Jr primeiro
                       (avaliadores PIBIC Jr são o recurso mais escasso)
fase 1 (docentes): para cada sala, escolher docente d da fila com
    conflito rígido nulo (nenhum t na sala com or(t) ≡ d), minimizando
    (desvio de preferência de tipo, nº de coautorias na sala)
fase 2 (preenchimento): enquanto houver progresso,
    para cada sala com menos de Y avaliadores:
        escolher o próximo avaliador válido pelo mesmo critério
        (uma vaga por sala por rodada, garantindo preenchimento equilibrado)
reserva ← avaliadores não alocados
```

O percurso por rodadas (round-robin) evita que as primeiras salas esgotem o banco de
avaliadores. A restrição rígida RN03 é aplicada como filtro de candidatos — jamais como
penalidade — de modo que **nenhuma saída do sorteio contém orientador avaliando a própria
sala**. Complexidade: O(|S| · Y · |A| · X) no pior caso.

### 8.3 Etapa 3 — validação contínua

Uma função de validação independente reavalia o estado completo (RN01–RN09) e produz a lista
de pendências em três níveis (conflito, recomendação, informação). Ela é executada após o
sorteio e após **cada ajuste manual**, garantindo que o organizador veja imediatamente o
efeito de qualquer movimentação — inclusive de movimentos que violem regras rígidas, os
quais são permitidos (a decisão final é humana), porém destacados como conflito.

### 8.4 Propriedades garantidas

- **Correção das restrições rígidas:** por construção, a saída automática satisfaz RN01–RN06;
- **Determinismo:** mesma entrada e mesma semente produzem a mesma saída (RN10);
- **Terminação:** ambas as etapas têm progresso monotônico e cota superior de iterações;
- **Transparência:** violações flexíveis inevitáveis são reportadas, nunca ocultadas.

## 9. Verificação com dados reais

A suíte automatizada (`npm run testar`) executa o pipeline completo — importação Even3,
importação de avaliadores e sorteio — com os dados do XXXVIII CIC (câmpus de
Registro/FCAVR):

**Entrada:** 59 trabalhos (50 gerais, 9 PIBIC Jr; 1 sem categoria, tratado como Geral) e
30 avaliadores (17 docentes, 8 pós-graduandos, 5 externos; 4 do tipo PIBIC Jr).
**Parâmetros:** X = 10, Y = 3, PIBIC Jr separado, S_J = 1, semente "TESTE1".

**Saída:** 6 salas — 5 gerais com 10 trabalhos e 1 PIBIC Jr com 9; todas com pelo menos um
docente; a sala PIBIC Jr recebeu os avaliadores PIBIC Jr (incluindo a única docente do
tipo); 12 avaliadores em reserva; nenhuma violação rígida; 1 aviso de concentração
inevitável (seção 7.7).

| Verificação | Resultado |
| --- | --- |
| Nenhum orientador avaliando a própria sala (RN03, com identidade nominal) | Aprovado |
| Todos os trabalhos alocados exatamente uma vez | Aprovado |
| Nenhum avaliador em mais de uma sala | Aprovado |
| Ao menos um docente por sala (RN04) | Aprovado |
| Salas PIBIC Jr contêm apenas trabalhos PIBIC Jr e vice-versa (RN05) | Aprovado |
| Sala PIBIC Jr priorizou avaliadores PIBIC Jr (RN06) | Aprovado |
| Determinismo: mesma semente reproduz o resultado; sementes distintas divergem (RN10) | Aprovado |
| Pulverização: nenhum orientador com 3 ou mais trabalhos na mesma sala geral (RN07) | Aprovado |

## 10. Privacidade e conformidade com a LGPD

- As planilhas contêm dados pessoais (nomes e e-mails de estudantes, orientadores e
  avaliadores). Todo o processamento ocorre em memória, no navegador do organizador;
- Não há backend, banco de dados, cookies de rastreamento ou chamadas de rede com dados dos
  participantes — atendendo aos princípios da **necessidade** e da **segurança**
  (art. 6º, incisos III e VII, da Lei nº 13.709/2018);
- Os arquivos reais do congresso são mantidos fora do repositório público (via .gitignore),
  que contém apenas o código-fonte;
- A exportação de resultados é gerada localmente e permanece sob custódia do organizador.

## 11. Implantação e operação

- **Publicação:** arquivos estáticos gerados por `npm run build` e publicados na branch
  `gh-pages` via `npm run deploy`; o GitHub Pages serve a aplicação sob HTTPS;
- **Requisitos do usuário:** navegador moderno (Chrome, Edge, Firefox ou Safari atuais);
  não requer instalação nem cadastro;
- **Custo de operação:** zero — não há servidores, bancos de dados ou licenças;
- **Portabilidade:** o build usa caminhos relativos e pode ser hospedado em qualquer
  servidor estático institucional da Unesp sem alteração de código.

## 12. Limitações conhecidas e evolução futura

- A heurística gulosa não garante otimalidade global dos objetivos flexíveis (apenas das
  restrições rígidas); para as instâncias do CIC, os resultados observados atingem o limite
  inferior teórico de concentração;
- A identidade nominal é heurística: homônimos parciais podem gerar falsos positivos
  (conservadores — bloqueiam alocação por precaução) e grafias muito divergentes sem e-mail
  podem escapar; mitigação: campo de e-mail nos templates e revisão na prévia;
- Evoluções sugeridas: arrastar-e-soltar no ajuste manual; exportação PDF nativa;
  persistência local de sessões de trabalho; suporte simultâneo a múltiplos eventos;
  testes unitários de interface; auditoria formal de acessibilidade (WCAG 2.2).

## 13. Referências

1. FISHER, R. A.; YATES, F. *Statistical Tables for Biological, Agricultural and Medical Research*. Edinburgh: Oliver & Boyd, 1938 (algoritmo de embaralhamento).
2. KNUTH, D. E. *The Art of Computer Programming*, v. 2: Seminumerical Algorithms. 3. ed. Addison-Wesley, 1997 (análise do embaralhamento imparcial).
3. ETTINGER, T. *Mulberry32*. 2017. Gerador pseudoaleatório de 32 bits, domínio público.
4. JOHNSON, D. S. *Near-optimal bin packing algorithms*. Tese (Doutorado) — MIT, 1973 (estratégia First-Fit Decreasing).
5. GAREY, M. R.; JOHNSON, D. S. *Computers and Intractability: A Guide to the Theory of NP-Completeness*. W. H. Freeman, 1979.
6. BRASIL. *Lei nº 13.709, de 14 de agosto de 2018* (Lei Geral de Proteção de Dados Pessoais — LGPD).
7. SheetJS Community Edition — https://sheetjs.com; React — https://react.dev; Vite — https://vite.dev; Tailwind CSS — https://tailwindcss.com.

---

**Desenvolvedor responsável:** Luiz Cláudio Chiavini Oliveira Júnior

**Produto:** Sorteio de Salas · CIC Unesp — versão 1.0.0

**Data:** 14 de setembro de 2026
