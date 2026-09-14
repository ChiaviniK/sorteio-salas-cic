# Sorteio de Salas · CIC Unesp

Aplicação web para distribuir **trabalhos** e **avaliadores** em salas no Congresso de
Iniciação Científica e Tecnológica da Unesp — com sorteio automático, regras do congresso
aplicadas e ajuste manual.

**100% no navegador:** as planilhas são processadas localmente, nenhum dado é enviado a servidores.

## Funcionalidades

- Templates padronizados para download (Trabalhos e Avaliadores)
- Importação direta da exportação do **Even3** (`ListaResultado`), com detecção automática
  de categoria (coluna "programa/agência") e orientador (último autor)
- Parâmetros: trabalhos por sala (X), avaliadores por sala (Y), PIBIC Jr junto ou em salas
  exclusivas (com quantidade de salas)
- Regras do sorteio:
  - **Rígida:** orientador nunca avalia a sala onde há trabalho seu
  - **Rígida:** ao menos 1 docente por sala
  - Salas PIBIC Jr priorizam avaliadores PIBIC Jr (completam com gerais se faltar)
  - **Flexível:** trabalhos do mesmo orientador são pulverizados em salas diferentes
  - **Flexível:** avaliador coautor de trabalho é evitado (alocado só com aviso)
- Comparação de nomes tolerante a abreviações ("Hugo Bendini" ≈ "Hugo do Nascimento Bendini")
- Semente registrada: o mesmo sorteio pode ser reproduzido/auditado
- Ajuste manual pós-sorteio com validação em tempo real
- Exportação em Excel (resumo, trabalhos e avaliadores por sala) e impressão (1 sala por página)

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção (dist/)
npm run testar   # teste do motor de sorteio com os dados reais de dados-exemplo/
```

Stack: React 19 + TypeScript + Vite + Tailwind CSS 4 + SheetJS.

## Publicação

O build gera arquivos estáticos com caminhos relativos (`dist/`), prontos para qualquer
hospedagem estática — GitHub Pages, Netlify, ou um servidor da própria Unesp.

## Estrutura

```
src/
  lib/
    sorteio.ts     # motor do sorteio: distribuição, alocação e validação
    planilhas.ts   # importação/exportação xlsx e geração de templates
    nomes.ts       # normalização e comparação de nomes
    rng.ts         # aleatoriedade determinística por semente
  components/      # interface (passos, cartões de sala, impressão)
dados-exemplo/     # arquivos reais do CIC (apenas local — fora do git por conterem dados pessoais)
scripts/           # teste de ponta a ponta e conversor da lista de avaliadores
```

> **Nota (LGPD):** a pasta `dados-exemplo/` contém nomes e e-mails reais e está no `.gitignore` —
> não é versionada nem publicada.
