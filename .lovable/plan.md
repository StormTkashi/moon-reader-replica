# Leitor de livros estilo Moon+ Reader

App de leitura para celular (web instalável, roda dentro do seu app Android via WebView), com visual escuro/claro no mesmo estilo do Moon+ Reader.

## Formatos
EPUB, PDF e TXT.

## Biblioteca
- Abrir arquivos do próprio aparelho (ficam salvos no aparelho, funciona offline)
- Conta com login e sincronização na nuvem: livros, progresso, marcações e notas acompanham o usuário em qualquer aparelho
- Estante com capas, busca, ordenação (recentes, título, autor), pastas/etiquetas, progresso em cada capa

## Leitura
- Paginação com virada de página (deslizar, toque nas laterais) e modo rolagem
- Temas prontos (dia, noite, sépia, pergaminho, preto puro) + tema personalizado
- Fonte, tamanho, entrelinha, margens, alinhamento, negrito
- Brilho por deslize na lateral, modo tela cheia, bloqueio de orientação
- Sumário, ir para página/porcentagem, busca dentro do livro
- Marcadores, destaques coloridos, notas, dicionário/tradução por seleção
- Rolagem automática com velocidade ajustável
- Gestos configuráveis (toque, deslize, botões de volume)
- Estatísticas de leitura: tempo, páginas, sequência de dias, metas
- Sincronização de posição de leitura entre aparelhos

Sem leitura em voz alta, conforme combinado.

## Ordem de construção
1. Base visual, temas e navegação
2. Estante + abrir arquivos locais (EPUB, PDF, TXT)
3. Tela de leitura completa com todos os ajustes
4. Marcações, notas, sumário e busca
5. Login e sincronização na nuvem
6. Estatísticas, gestos e ajustes finos

## Detalhes técnicos
- TanStack Start + React + Tailwind, tokens de tema em `src/styles.css`
- EPUB: epub.js; PDF: pdf.js; TXT: parser próprio com paginação
- Armazenamento local: IndexedDB para arquivos e metadados; renderização do leitor apenas no cliente (`ClientOnly` + import dinâmico)
- Lovable Cloud para contas, sincronização e armazenamento dos arquivos, com RLS por usuário
- Manifest PWA + service worker para uso offline e instalação no Android
