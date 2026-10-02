# Teatro Arena 3D

Jogo educacional 3D multiplayer sobre teatro, para a sala de aula. Funciona no computador, no celular e em óculos de VR (WebXR).

## Publicar no Render (plano gratuito)
1. Crie um repositório no GitHub e envie esta pasta (o `node_modules` fica de fora, o `.gitignore` já cuida disso).
2. No Render: **New +** > **Web Service** > conecte o repositório.
   - Runtime: Node · Build Command: `npm install` · Start Command: `npm start` · Instance Type: **Free**
   - (Ou use **New +** > **Blueprint**, que lê o `render.yaml` automaticamente.)
3. Quando o deploy terminar, abra a URL `https://SEU-APP.onrender.com`.

Observações do plano gratuito:
- Depois de ~15 min sem acessos o serviço "dorme". O primeiro acesso seguinte demora cerca de 1 minuto para acordar (o jogo mostra um aviso e tenta de novo sozinho). Abra o link 2 minutos antes da aula.
- Não há banco de dados: salas e placares vivem na memória e somem se o serviço reiniciar.
- Se a conexão cair, o jogo reconecta e devolve o jogador à mesma sala com o mesmo nome.

## Como usar em aula
- **Professor(a):** abra o site no computador ligado ao projetor, marque **Telão da sala** e clique em **Criar sala**. Passe o código de 4 letras (ou o link com `?sala=CODIGO`) para a turma.
- **Alunos:** abrem o link no celular ou PC, digitam nome, escolhem cor e máscara e entram.
- No camarim (lobby) o professor escolhe número de cenas, pacote de conteúdo, equipes e se haverá texto livre nas improvisações (desligado por padrão, por segurança). Pode remover jogadores e adicionar bots.
- **Treino solo** cria uma sala com 4 bots.

## Modos de cena
Quiz Cênico (plataformas A-D) · Verdadeiro ou Falso · Direção de Cena (zonas do palco, direita/esquerda do ator) · Cena Relâmpago (improviso com pose e fala, votação da turma). A última cena vale pontos dobrados.

## VR
Em navegador com WebXR (ex.: Meta Quest), entre na sala e use o botão **ENTER VR**. Direcional esquerdo move, direcional direito gira, gatilho aponta (escolher pose/fala e votar nos atores).

## Conteúdo
`server/content.js` (perguntas, V/F, direções, improvisos) e `public/js/enciclopedia.js` (Camarim). São arquivos simples: dá para acrescentar perguntas seguindo o formato dos existentes.

## Rodar localmente
```
npm install
npm start     # http://localhost:3000
```
