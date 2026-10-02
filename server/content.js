// Conteúdo pedagógico do jogo.
// QUIZ: [categoria, pergunta, CERTA, errada1, errada2, errada3, "Você sabia?"]
// (as alternativas são embaralhadas pelo servidor a cada rodada)

export const CAT_LABEL = {
  grecia: 'Grécia Antiga',
  historia: 'História do Teatro',
  palco: 'Palco & Equipe',
  generos: 'Gêneros & Estilos',
  tecnicas: 'Técnicas & Teóricos',
  brasil: 'Teatro Brasileiro',
  mundo: 'Teatro pelo Mundo',
  curiosidades: 'Curiosidades',
};

export const PACKS = {
  all: Object.keys(CAT_LABEL),
  historia: ['grecia', 'historia', 'curiosidades'],
  palco: ['palco', 'generos', 'tecnicas'],
  brasil: ['brasil', 'mundo'],
};

export const QUIZ = [
  // ---------- GRÉCIA ----------
  ['grecia', 'Em honra a qual deus nasceram os festivais de teatro da Grécia Antiga?', 'Dioniso', 'Zeus', 'Apolo', 'Atena', 'As Grandes Dionísias, em Atenas, tinham concursos de tragédia e comédia em homenagem a Dioniso, deus do vinho e da festa.'],
  ['grecia', 'Como se chamava o grupo que cantava, dançava e comentava a ação nas tragédias gregas?', 'Coro', 'Plateia', 'Bastidores', 'Prólogo', 'O coro era a voz da comunidade: comentava os fatos, aconselhava os personagens e dava ritmo ao espetáculo.'],
  ['grecia', 'Quem a tradição aponta como o primeiro ator da história?', 'Tespis', 'Sófocles', 'Aristóteles', 'Homero', 'Tespis teria separado um ator do coro, criando o diálogo. Em inglês, ator ainda é "thespian" em homenagem a ele.'],
  ['grecia', 'Qual peça de Sófocles conta a história de um rei que descobre ter matado o pai e casado com a mãe?', 'Édipo Rei', 'Antígona', 'Medeia', 'Lisístrata', 'Édipo Rei é considerada uma das maiores tragédias de todos os tempos e foi analisada por Aristóteles.'],
  ['grecia', 'Qual autor grego escreveu comédias como "As Nuvens" e "As Rãs"?', 'Aristófanes', 'Eurípides', 'Ésquilo', 'Sófocles', 'Aristófanes foi o grande nome da comédia antiga: fazia humor com a política e as figuras públicas de Atenas.'],
  ['grecia', 'O que os atores gregos usavam para viver vários personagens e serem reconhecidos de longe?', 'Máscaras', 'Microfones', 'Capacetes', 'Perucas de lã', 'As máscaras indicavam o tipo de personagem e a emoção, e ajudavam a plateia do grande teatro ao ar livre a entender a cena.'],
  ['grecia', 'Segundo Aristóteles, a tragédia provoca no público uma "purificação" das emoções chamada...', 'Catarse', 'Peripécia', 'Anagnórise', 'Hybris', 'Na "Poética", Aristóteles explica que a tragédia desperta piedade e temor, e o público se purifica dessas emoções: a catarse.'],
  ['grecia', 'Como se chama a área circular do teatro grego onde o coro dançava e cantava?', 'Orquestra', 'Skené', 'Proscênio', 'Coxia', 'Orquestra significa "lugar de dançar". A skené era a construção ao fundo, usada como cenário e vestiário (daí vem a palavra "cena").'],
  ['grecia', 'Na Grécia clássica, quem podia atuar nos teatros oficiais?', 'Somente homens', 'Somente mulheres', 'Somente crianças', 'Qualquer pessoa', 'Os papéis femininos também eram feitos por homens, com máscaras e figurinos apropriados.'],
  ['grecia', 'O que significa a expressão "deus ex machina"?', 'Um deus surge por uma máquina para resolver a trama', 'Um ator que esquece o texto', 'Um coro sem música', 'Um final trágico', 'Nas peças gregas, um guindaste fazia um deus "voar" para resolver o conflito. Hoje a expressão indica soluções improváveis na história.'],

  // ---------- HISTÓRIA ----------
  ['historia', 'Plauto e Terêncio foram autores de...', 'Comédias romanas', 'Tragédias gregas', 'Autos medievais', 'Óperas italianas', 'As comédias de Plauto e Terêncio inspiraram autores do Renascimento e até Molière.'],
  ['historia', 'Qual autor romano escreveu tragédias que inspiraram os dramaturgos do Renascimento?', 'Sêneca', 'Plauto', 'Virgílio', 'Horácio', 'As tragédias de Sêneca, cheias de vingança e fantasmas, influenciaram autores elisabetanos como Shakespeare.'],
  ['historia', 'Onde começou o teatro religioso da Idade Média?', 'Dentro das igrejas', 'Em estádios', 'Em tavernas', 'Em castelos reais', 'O drama litúrgico encenava passagens da Bíblia nas celebrações; depois as peças saíram para as praças.'],
  ['historia', 'Que tipo de peça medieval usava personagens como Vício e Virtude para ensinar valores?', 'Moralidade', 'Tragédia grega', 'Comédia romana', 'Teatro de revista', 'Nas moralidades, personagens alegóricos ensinavam lições de vida. "Everyman" é a mais famosa.'],
  ['historia', 'Em que país nasceu a Commedia dell\'arte?', 'Itália', 'França', 'Espanha', 'Grécia', 'Surgiu no século XVI, com trupes itinerantes que improvisavam a partir de roteiros e usavam máscaras.'],
  ['historia', 'Na Commedia dell\'arte, quem é o servo esperto e acrobático de roupa de losangos coloridos?', 'Arlequim', 'Pantaleão', 'Capitão', 'Doutor', 'Arlequim (Arlecchino) é ágil e brincalhão, famoso pelo figurino de remendos coloridos.'],
  ['historia', 'Qual personagem da Commedia dell\'arte é o velho comerciante avarento?', 'Pantaleão', 'Colombina', 'Arlequim', 'Briguela', 'Pantaleão (Pantalone) é rico, mesquinho e vive sendo enganado pelos servos.'],
  ['historia', 'Como eram feitas as peças da Commedia dell\'arte?', 'Com roteiro-base e muita improvisação', 'Com texto decorado palavra por palavra', 'Somente com mímica', 'Somente com música', 'O roteiro-base (canovaccio) trazia só a trama; os atores improvisavam falas e piadas, chamadas lazzi.'],
  ['historia', 'Qual era o nome do famoso teatro de Shakespeare em Londres?', 'Globe', 'Coliseu', 'Odeon', 'Teatro Real', 'O Globe foi inaugurado em 1599 e tinha o palco avançando sobre o pátio, onde parte do público assistia de pé.'],
  ['historia', 'Quem escreveu "Romeu e Julieta"?', 'William Shakespeare', 'Molière', 'Henrik Ibsen', 'Bertolt Brecht', 'Shakespeare escreveu cerca de 37 peças entre tragédias, comédias e dramas históricos.'],
  ['historia', 'Na época de Shakespeare, quem interpretava os papéis femininos?', 'Rapazes atores', 'Mulheres', 'Bonecos', 'Os diretores', 'Na Inglaterra elisabetana as mulheres eram proibidas de atuar nos palcos públicos; jovens atores faziam esses papéis.'],
  ['historia', 'O que aconteceu com o primeiro Globe em 1613?', 'Pegou fogo durante uma apresentação', 'Foi vendido', 'Virou igreja', 'Foi inundado', 'Durante "Henrique VIII", um tiro de canhão de cena incendiou o teto de palha. O teatro foi reconstruído em seguida.'],
  ['historia', 'Quem escreveu "O Avarento" e "Tartufo"?', 'Molière', 'Racine', 'Lope de Vega', 'Gil Vicente', 'Molière (1622–1673) foi mestre da comédia de costumes na França e também atuava nas próprias peças.'],
  ['historia', 'Em "Sonho de uma Noite de Verão", qual duende travesso usa uma flor mágica e confunde os casais?', 'Puck', 'Iago', 'Falstaff', 'Hamlet', 'Puck (ou Robin Goodfellow) é o duende que causa toda a confusão amorosa da floresta.'],
  ['historia', 'Em "Hamlet", de qual país é o príncipe?', 'Dinamarca', 'Escócia', 'Itália', 'Inglaterra', 'A história se passa no castelo de Elsinore, na Dinamarca. É dessa peça a famosa dúvida "Ser ou não ser".'],

  // ---------- PALCO & EQUIPE ----------
  ['palco', 'Como se chama o espaço lateral do palco, escondido do público, onde os atores esperam a entrada?', 'Coxia', 'Plateia', 'Proscênio', 'Foyer', 'Na coxia ficam atores, objetos de cena e equipe técnica esperando a hora certa de entrar.'],
  ['palco', 'O que é o proscênio?', 'A faixa do palco mais próxima da plateia', 'A cortina principal', 'A sala de maquiagem', 'O alto do palco', 'O proscênio é a parte da frente do palco, entre a cortina e a plateia.'],
  ['palco', 'Quem sopra o texto aos atores quando eles esquecem a fala?', 'Ponto', 'Contrarregra', 'Iluminador', 'Figurinista', 'O ponto fica escondido e ajuda com o texto. Hoje é uma função mais rara.'],
  ['palco', 'Quem cuida dos objetos de cena e auxilia as entradas dos atores?', 'Contrarregra', 'Ponto', 'Diretor', 'Cenógrafo', 'O contrarregra prepara adereços e objetos e confere se tudo está pronto para cada cena.'],
  ['palco', 'Quem cria o projeto visual do cenário?', 'Cenógrafo', 'Sonoplasta', 'Maquiador', 'Bilheteiro', 'O cenógrafo desenha o espaço da peça: móveis, estruturas, cores e ambientes.'],
  ['palco', 'Quem é responsável por criar as roupas dos personagens?', 'Figurinista', 'Cenógrafo', 'Contrarregra', 'Ponto', 'O figurino ajuda a contar quem é o personagem, de que época e de que lugar.'],
  ['palco', 'Quem escolhe e opera músicas e efeitos sonoros do espetáculo?', 'Sonoplasta', 'Iluminador', 'Cenotécnico', 'Dramaturgo', 'A sonoplastia inclui trilha e ruídos (chuva, passos, trovões).'],
  ['palco', 'Quem coordena a criação da encenação, orientando atores e equipe?', 'Diretor', 'Bilheteiro', 'Camareira', 'Dramaturgo', 'O diretor une texto, atuação, cenário, luz e som numa só proposta artística.'],
  ['palco', 'Quem escreve o texto de uma peça?', 'Dramaturgo', 'Diretor', 'Produtor', 'Figurinista', 'O dramaturgo cria o texto teatral: falas, conflitos e personagens.'],
  ['palco', 'Como se chama a parte alta acima do palco onde ficam varas, luzes e cenários suspensos?', 'Urdimento', 'Fosso', 'Plateia', 'Bilheteria', 'No urdimento, cenários e refletores são pendurados em varas e içados ou baixados durante o espetáculo.'],
  ['palco', 'O que é a "quarta parede"?', 'Parede imaginária entre o palco e a plateia', 'A parede dos fundos do palco', 'A cortina de ferro', 'A última fileira da plateia', 'Num palco italiano há três paredes de cenário (fundo e laterais); a quarta, imaginária, é por onde o público "espia". No teatro realista os atores agem como se ela existisse.'],
  ['palco', 'O que é uma "deixa" no teatro?', 'Sinal (fala ou ação) que indica a hora de entrar ou falar', 'O final da peça', 'Um elogio da crítica', 'O intervalo', 'Saber a deixa é essencial para atuar em equipe e manter o ritmo da cena.'],
  ['palco', 'Para que serve a rubrica no texto teatral?', 'Dar indicações de ação, cenário e gestos', 'Registrar os aplausos', 'Marcar o preço do ingresso', 'Substituir as falas', 'A rubrica é a orientação do autor, geralmente entre parênteses ou em itálico.'],
  ['palco', 'O que é um monólogo?', 'Fala de um personagem sozinho em cena', 'Cena com muitos atores', 'Peça sem texto', 'Fala do coro', 'Um monólogo expõe pensamentos e sentimentos de um personagem, como o famoso "Ser ou não ser".'],
  ['palco', 'O que é um aparte?', 'Fala dirigida ao público que os outros personagens "não ouvem"', 'O intervalo', 'Uma cortina lateral', 'Uma cena final', 'O aparte cria cumplicidade entre personagem e plateia.'],
  ['palco', 'Onde fica o público no teatro de arena?', 'Ao redor da cena', 'Só na frente', 'Somente nos camarotes', 'Do lado de fora do teatro', 'No teatro de arena, a cena fica no centro e o público assiste de vários lados.'],
  ['palco', 'Como funciona o palco italiano?', 'O público assiste de frente, por uma abertura chamada boca de cena', 'O público fica em círculo', 'Só existe ao ar livre', 'Não tem cortina', 'Nasceu no Renascimento e ainda é o formato mais comum de teatro.'],
  ['palco', 'O que é o camarim?', 'Sala onde os atores se vestem e se preparam', 'Local do público', 'Cortina do palco', 'Bilheteria', 'No camarim acontecem maquiagem, troca de figurino e aquecimento antes de entrar em cena.'],
  ['palco', 'O que significa "ensaio geral"?', 'Ensaio completo com cenário, luz, som e figurino', 'Primeira leitura do texto', 'Última apresentação da temporada', 'Ensaio só de música', 'O ensaio geral é a "prova final" antes da estreia: tudo funciona como no espetáculo.'],
  ['palco', 'O que é a ribalta?', 'Linha de luzes na frente do palco', 'A cortina de fundo', 'A porta do camarim', 'A plateia', 'Por extensão, "estar na ribalta" significa estar em evidência.'],
  ['palco', 'O que significa "black-out" no teatro?', 'Escurecimento total do palco', 'Falha de som', 'Fim do intervalo', 'Troca de figurino', 'O black-out é muito usado para encerrar cenas ou trocar cenário sem o público ver.'],
  ['palco', 'Qual é o papel do iluminador?', 'Criar a luz que mostra espaço, clima e hora da cena', 'Escrever o texto', 'Dirigir os atores', 'Vender ingressos', 'A luz muda emoções: tons azulados podem sugerir noite e frio; dourados, calor e aconchego.'],

  // ---------- GÊNEROS ----------
  ['generos', 'Qual gênero busca o riso, critica costumes e costuma ter final feliz?', 'Comédia', 'Tragédia', 'Teatro épico', 'Auto', 'A comédia mostra vícios e costumes humanos com humor.'],
  ['generos', 'Qual gênero trata de conflitos graves e termina com a queda do herói?', 'Tragédia', 'Farsa', 'Revista', 'Comédia', 'Na tragédia, o destino e os erros do herói levam a um desfecho doloroso.'],
  ['generos', 'O que mistura a tragicomédia?', 'Elementos trágicos e cômicos', 'Música e dança', 'Teatro e cinema', 'Texto e mímica', 'Ela alterna emoção séria e humor, como acontece muitas vezes na vida real.'],
  ['generos', 'A farsa é caracterizada por...', 'Humor exagerado, confusões e ritmo acelerado', 'Silêncio total', 'Final trágico', 'Coro grego', 'Portas batendo, trocas de identidade e correria são ingredientes clássicos da farsa.'],
  ['generos', 'O teatro de revista brasileiro mistura...', 'Esquetes, música, humor e crítica social', 'Somente tragédias', 'Somente balé clássico', 'Somente mímica', 'A revista fez enorme sucesso no Rio de Janeiro, comentando os fatos do ano com humor e música.'],
  ['generos', 'O que é um musical teatral?', 'Peça em que canto e dança fazem parte da narrativa', 'Peça sem texto', 'Teatro de sombras', 'Leitura de poemas', 'No musical, as canções ajudam a contar a história e revelar emoções.'],
  ['generos', 'O mamulengo é um tipo de...', 'Teatro de bonecos popular do Nordeste', 'Dança de roda', 'Ópera italiana', 'Máscara grega', 'O mamulengo é uma tradição de bonecos do Nordeste, reconhecida como patrimônio cultural brasileiro.'],
  ['generos', 'O teatro de sombras utiliza...', 'Figuras e silhuetas projetadas numa tela iluminada', 'Máscaras de madeira', 'Fogos de artifício', 'Espelhos gigantes', 'Na Indonésia, o wayang kulit usa figuras de couro recortado diante de uma lâmpada.'],
  ['generos', 'Mímica é a arte de...', 'Contar histórias com o corpo e gestos, sem fala', 'Cantar ópera', 'Escrever peças', 'Pintar cenários', 'O mímico mais famoso foi o francês Marcel Marceau, com seu personagem Bip.'],
  ['generos', 'O que é improvisação teatral?', 'Criar a cena na hora, sem texto decorado', 'Decorar um texto longo', 'Ler um roteiro em voz alta', 'Copiar um filme', 'A improvisação treina escuta, criatividade e confiança no parceiro de cena.'],
  ['generos', 'Qual é a principal característica do teatro de rua?', 'Acontece em espaços públicos, como ruas e praças', 'Só acontece em teatros fechados', 'Só acontece de noite', 'Não tem público', 'O teatro de rua leva o espetáculo até as pessoas, sem exigir palco tradicional.'],
  ['generos', 'Qual obra de Ariano Suassuna mistura humor, fé e cultura nordestina?', 'Auto da Compadecida', 'Vestido de Noiva', 'O Pagador de Promessas', 'Pluft, o Fantasminha', 'O Auto da Compadecida (escrito em 1955) tem personagens inesquecíveis como João Grilo e Chicó.'],
  ['generos', 'Um "auto" é...', 'Peça curta de tom religioso ou popular, comum na tradição ibérica e brasileira', 'Uma ópera francesa', 'Um teatro japonês', 'Uma comédia romana', 'Gil Vicente e Ariano Suassuna escreveram autos.'],

  // ---------- TÉCNICAS & TEÓRICOS ----------
  ['tecnicas', 'Qual mestre criou um "sistema" de preparação do ator, com o "se mágico"?', 'Constantin Stanislavski', 'Bertolt Brecht', 'Augusto Boal', 'Antonin Artaud', 'No "se mágico", o ator se pergunta: "O que eu faria SE estivesse nessa situação?".'],
  ['tecnicas', 'O que Brecht propunha com o "distanciamento"?', 'Que o público refletisse criticamente sobre o que vê', 'Que o público dormisse', 'Que os atores chorassem de verdade', 'Cenários luxuosos', 'No teatro épico, cartazes, canções e narradores lembram que é teatro e convidam o público a pensar.'],
  ['tecnicas', 'Quem criou o Teatro do Oprimido?', 'Augusto Boal', 'Nelson Rodrigues', 'Zé Celso', 'Plínio Marcos', 'Boal criou jogos e técnicas para transformar o público em participante da cena e debater problemas sociais.'],
  ['tecnicas', 'No Teatro-Fórum, como se chama o espectador que entra em cena para propor soluções?', 'Espect-ator', 'Contrarregra', 'Ponto', 'Corifeu', '"Espect-ator" junta espectador e ator: quem assiste também age.'],
  ['tecnicas', 'Viola Spolin ficou famosa por sistematizar...', 'Os jogos teatrais', 'A cenografia digital', 'A ópera', 'A mímica clássica', 'Seus jogos teatrais, com foco e regras simples, influenciam o ensino de teatro e a improvisação até hoje.'],
  ['tecnicas', 'Quem escreveu "Esperando Godot"?', 'Samuel Beckett', 'Henrik Ibsen', 'Eugène Ionesco', 'Luigi Pirandello', 'Em 1953, Beckett estreou a peça-símbolo do Teatro do Absurdo: dois homens esperam alguém que nunca chega.'],
  ['tecnicas', 'O Teatro do Absurdo costuma mostrar...', 'Situações sem lógica aparente e a falta de sentido da existência', 'Heróis perfeitos', 'Contos de fadas', 'Documentários', 'Diálogos repetitivos e cenas estranhas mostram a dificuldade de comunicação e de dar sentido ao mundo.'],
  ['tecnicas', 'Qual dramaturgo norueguês escreveu "Casa de Bonecas" (1879)?', 'Henrik Ibsen', 'Anton Tchekhov', 'Molière', 'Sófocles', 'Nora, a protagonista, abandona o lar em busca de liberdade — uma cena que chocou a Europa.'],
  ['tecnicas', 'Quem escreveu "A Gaivota" e "O Jardim das Cerejeiras"?', 'Anton Tchekhov', 'Nikolai Gógol', 'Liev Tolstói', 'Fiódor Dostoiévski', 'Tchekhov, em parceria com Stanislavski e o Teatro de Arte de Moscou, renovou a dramaturgia moderna.'],
  ['tecnicas', 'O "Teatro Pobre" de Grotowski valoriza...', 'O ator e sua relação com o público, com poucos recursos', 'Grandes cenários', 'Efeitos digitais', 'Orquestras', 'Jerzy Grotowski, da Polônia, defendia que o teatro é essencialmente o encontro entre ator e espectador.'],
  ['tecnicas', 'Para que serve o aquecimento vocal?', 'Preparar voz, respiração e dicção', 'Esquecer o texto', 'Diminuir o público', 'Trocar o figurino', 'Atores aquecem a voz com respiração, vibração de lábios e trava-línguas.'],
  ['tecnicas', 'O que é projeção vocal?', 'Fazer a voz chegar nítida ao fundo da plateia sem gritar', 'Cantar em coro', 'Falar baixinho', 'Falar rápido', 'Projetar exige respiração profunda e boa articulação, não força na garganta.'],

  // ---------- BRASIL ----------
  ['brasil', 'Que religioso jesuíta usou autos no Brasil colonial para a catequese?', 'Padre José de Anchieta', 'Gil Vicente', 'Martins Pena', 'Nelson Rodrigues', 'No século XVI, Anchieta escreveu autos em tupi, português e espanhol.'],
  ['brasil', 'Quem é lembrado como pioneiro da comédia de costumes no Brasil?', 'Martins Pena', 'Machado de Assis', 'Gonçalves Dias', 'Castro Alves', 'Martins Pena (1815–1848) retratou o Brasil do século XIX com humor, em peças como "O Juiz de Paz da Roça".'],
  ['brasil', 'Qual peça de 1943, dirigida por Ziembinski, é marco do teatro moderno brasileiro?', 'Vestido de Noiva', 'Pluft, o Fantasminha', 'Roda Viva', 'O Rei da Vela', 'O texto é de Nelson Rodrigues; a montagem usou três planos (realidade, memória e alucinação) e inovou na cena.'],
  ['brasil', 'Que grupo paulistano, fundado em 1953, teve Augusto Boal e Gianfrancesco Guarnieri?', 'Teatro de Arena', 'Teatro Amazonas', 'O Tablado', 'Teatro Municipal', 'O Arena trouxe temas brasileiros e populares ao palco, como em "Eles Não Usam Black-Tie" (1958).'],
  ['brasil', 'Quem escreveu "Pluft, o Fantasminha"?', 'Maria Clara Machado', 'Cecília Meireles', 'Clarice Lispector', 'Ruth Rocha', 'Maria Clara Machado fundou O Tablado (Rio de Janeiro, 1951) e é referência do teatro infantil brasileiro.'],
  ['brasil', 'Qual teatro de Manaus, inaugurado em 1896, é famoso por sua cúpula colorida?', 'Teatro Amazonas', 'Theatro da Paz', 'Teatro Municipal de São Paulo', 'O Tablado', 'Construído na época áurea da borracha, é um dos teatros mais conhecidos do país.'],
  ['brasil', 'Quem escreveu "O Pagador de Promessas"?', 'Dias Gomes', 'Ariano Suassuna', 'Nelson Rodrigues', 'Augusto Boal', 'A peça é de 1959; a versão para o cinema ganhou a Palma de Ouro de Cannes em 1962.'],
  ['brasil', 'Qual dramaturgo escreveu "Boca de Ouro" e "Álbum de Família"?', 'Nelson Rodrigues', 'Plínio Marcos', 'Ariano Suassuna', 'Gianfrancesco Guarnieri', 'Nelson Rodrigues revolucionou a dramaturgia brasileira com temas intensos do cotidiano e do inconsciente.'],
  ['brasil', 'O bumba meu boi, tradição forte no Maranhão, mistura...', 'Teatro, dança, música e figurinos em torno de um boi', 'Só capoeira', 'Só ópera', 'Só mímica', 'A história do boi que morre e ressuscita é encenada com música e personagens populares.'],
  ['brasil', 'O Teatro Oficina é ligado a qual nome?', 'José Celso Martinez Corrêa', 'Augusto Boal', 'Maria Clara Machado', 'Ziembinski', 'O Oficina, em São Paulo, é famoso por montagens ousadas, como "O Rei da Vela" (1967).'],
  ['brasil', 'Qual atriz brasileira foi indicada ao Oscar de Melhor Atriz por "Central do Brasil"?', 'Fernanda Montenegro', 'Regina Duarte', 'Marília Pêra', 'Dercy Gonçalves', 'Fernanda Montenegro tem uma longa carreira nos palcos, no cinema e na TV.'],
  ['brasil', 'Quem escreveu "O Mambembe", comédia sobre uma trupe de teatro itinerante?', 'Artur Azevedo', 'Machado de Assis', 'Gil Vicente', 'Martins Pena', '"O Mambembe" (1904) homenageia as companhias teatrais que viajavam pelo interior.'],

  // ---------- MUNDO ----------
  ['mundo', 'Qual teatro japonês usa máscaras, ritmo lento e movimentos refinados desde o século XIV?', 'Teatro Nô', 'Kabuki', 'Bunraku', 'Ikebana', 'O Nô, aperfeiçoado por Zeami, usa máscaras e pouquíssimos elementos de cena.'],
  ['mundo', 'O Kabuki é famoso por...', 'Maquiagem marcante, figurinos luxuosos e passarela pela plateia (hanamichi)', 'Silêncio e sombras', 'Marionetes gigantes', 'Máscaras lisas de madeira', 'O Kabuki nasceu no início do século XVII e, hoje, é tradicionalmente feito apenas por atores homens.'],
  ['mundo', 'No Bunraku japonês, quem "atua"?', 'Bonecos grandes manipulados à vista por titereiros', 'Atores com máscaras de ouro', 'Sombras', 'Mímicos', 'Cada boneco principal costuma ser manipulado por três artistas.'],
  ['mundo', 'Em qual país nasceu o Kathakali, teatro-dança de maquiagem elaborada e gestos (mudras)?', 'Índia', 'China', 'Japão', 'Indonésia', 'O Kathakali é do estado de Kerala e conta histórias de epopeias indianas com gestos e expressões dos olhos.'],
  ['mundo', 'O wayang kulit, teatro de sombras com figuras de couro, é tradicional de qual país?', 'Indonésia', 'Canadá', 'Argentina', 'Egito', 'Um mestre, o dalang, manipula as figuras e dá voz a todos os personagens.'],
  ['mundo', 'O que a Ópera de Pequim combina?', 'Canto, acrobacia, mímica e maquiagem simbólica', 'Somente falas', 'Somente silêncio', 'Somente sombras', 'As cores da maquiagem facial indicam o caráter do personagem.'],
  ['mundo', 'O "Natya Shastra" é...', 'Antigo tratado indiano sobre artes cênicas', 'Uma peça grega', 'Uma revista brasileira', 'Uma máscara japonesa', 'Atribuído ao sábio Bharata, descreve gestos, emoções e música do teatro e da dança da Índia.'],
  ['mundo', 'Qual teatro grego é famoso por sua acústica?', 'Epidauro', 'Coliseu', 'Globe', 'Teatro Amazonas', 'Construído no século IV a.C., Epidauro ainda recebe espetáculos.'],
  ['mundo', 'No teatro e na tradição oral da África Ocidental, quem conta histórias com música e memória?', 'O griot', 'O contrarregra', 'O dalang', 'O corifeu', 'Os griots preservam histórias, genealogias e canções.'],

  // ---------- CURIOSIDADES ----------
  ['curiosidades', 'O que os atores dizem para desejar boa sorte antes de entrar em cena?', 'Quebre a perna!', 'Boa viagem!', 'Feliz aniversário!', 'Silêncio!', '"Break a leg" é a versão mais famosa; evita-se desejar "boa sorte" diretamente por superstição.'],
  ['curiosidades', 'Qual peça de Shakespeare é chamada de "a peça escocesa" por superstição?', 'Macbeth', 'Otelo', 'Rei Lear', 'A Tempestade', 'Muitos atores evitam dizer o nome Macbeth dentro do teatro.'],
  ['curiosidades', 'Qual peça de Agatha Christie está em cartaz em Londres desde 1952?', 'A Ratoeira', 'Assassinato no Expresso do Oriente', 'Morte no Nilo', 'O Caso dos Dez Negrinhos', '"The Mousetrap" é a peça com a maior temporada contínua da história.'],
  ['curiosidades', 'O que é a "luz fantasma" (ghost light)?', 'Lâmpada deixada acesa no palco vazio', 'Um refletor azul', 'Um efeito de fumaça', 'Uma lanterna mágica', 'Ela evita acidentes no escuro e, segundo a tradição, "acompanha" os fantasmas do teatro.'],
  ['curiosidades', 'O que significam os "três sinais" antes de um espetáculo no Brasil?', 'Avisos de que a peça vai começar; o terceiro marca o início', 'Três finais possíveis', 'Três atos', 'Três aplausos', 'Os sinais convidam o público a ocupar seus lugares.'],
  ['curiosidades', 'O nariz vermelho do palhaço é frequentemente chamado de...', 'A menor máscara do mundo', 'O maior figurino', 'Um adereço de ópera', 'Uma peruca', 'Ao colocar o nariz, o palhaço revela sua ingenuidade e vulnerabilidade diante do público.'],
  ['curiosidades', 'Como se chama quem assiste ao espetáculo?', 'Espectador', 'Contrarregra', 'Dramaturgo', 'Corifeu', 'Sem espectador não há teatro: ator e público dividem o mesmo momento.'],
  ['curiosidades', 'Onde fica o Shakespeare\'s Globe reconstruído, inaugurado em 1997?', 'Londres', 'Roma', 'Madri', 'Nova York', 'A reconstrução fica perto do local do Globe original, às margens do rio Tâmisa.'],
];

// VF: [categoria, afirmação, verdadeira?, explicação]
export const VF = [
  ['grecia', 'No teatro grego clássico, as mulheres podiam atuar.', false, 'Só homens atuavam; eles faziam também os papéis femininos, com máscaras e figurinos.'],
  ['grecia', 'As tragédias gregas eram apresentadas em teatros ao ar livre, de dia.', true, 'Os teatros ficavam em encostas, e os espetáculos aconteciam durante festivais religiosos.'],
  ['palco', 'A quarta parede é uma parede imaginária entre o palco e a plateia.', true, 'Ela existe só na convenção do teatro realista.'],
  ['palco', 'Direita e esquerda do palco são sempre do ponto de vista do ator voltado para a plateia.', true, 'Por isso a "direita do palco" fica à esquerda de quem assiste.'],
  ['palco', 'O ponto é quem acende as luzes do espetáculo.', false, 'O ponto ajuda os atores com o texto; quem cuida da luz é o iluminador.'],
  ['palco', 'A coxia fica na plateia.', false, 'A coxia fica nas laterais do palco, escondida do público.'],
  ['palco', 'O contrarregra é quem escreve a peça.', false, 'Quem escreve é o dramaturgo; o contrarregra cuida dos objetos e das entradas.'],
  ['palco', 'A rubrica é uma fala do personagem dita ao público.', false, 'A rubrica é uma indicação do autor sobre ação, cenário ou gesto.'],
  ['palco', 'A luz fantasma (ghost light) fica acesa no palco vazio.', true, 'É uma tradição de segurança, cercada de histórias de fantasmas.'],
  ['historia', 'A Commedia dell\'arte usava máscaras e improvisação a partir de roteiros-base.', true, 'Os roteiros (canovaccio) traziam só a trama; as falas nasciam na cena.'],
  ['historia', 'Shakespeare escreveu "Édipo Rei".', false, '"Édipo Rei" é de Sófocles, na Grécia Antiga.'],
  ['historia', 'O Globe original foi destruído por um incêndio em 1613.', true, 'Um canhão de cena incendiou o teto de palha durante "Henrique VIII".'],
  ['historia', 'O teatro surgiu apenas no século XX.', false, 'Existem rituais cênicos desde a pré-história e o teatro grego tem mais de 2.500 anos.'],
  ['tecnicas', 'Brecht queria que o público esquecesse que estava no teatro e se emocionasse sem refletir.', false, 'Brecht queria o contrário: um público crítico, que pensasse sobre o que via.'],
  ['tecnicas', 'Stanislavski criou um sistema de preparação do ator.', true, 'Seu "sistema" influenciou a atuação no mundo todo.'],
  ['tecnicas', 'Augusto Boal criou o Teatro do Oprimido.', true, 'Boal foi um diretor brasileiro, conhecido mundialmente.'],
  ['generos', 'Teatro pode ser feito sem palco, sem cenário e sem figurino.', true, 'Basta um ator, um espectador e uma situação: o teatro está no encontro.'],
  ['generos', 'Em teatro, monólogo é uma cena com muitos atores falando ao mesmo tempo.', false, 'Monólogo é a fala longa de um personagem sozinho.'],
  ['generos', 'O mamulengo é um tipo de teatro de bonecos do Nordeste brasileiro.', true, 'Ele é tradição em Pernambuco e em outros estados do Nordeste.'],
  ['generos', 'A improvisação é uma técnica teatral.', true, 'Ela treina escuta, criatividade e confiança no grupo.'],
  ['generos', 'O musical teatral nunca usa dança.', false, 'Dança e canto são ingredientes centrais do teatro musical.'],
  ['brasil', 'O Teatro Amazonas fica em Manaus.', true, 'Foi inaugurado em 1896, no auge do ciclo da borracha.'],
  ['brasil', 'Na BNCC, o Teatro é uma das linguagens da área de Arte.', true, 'As outras são Artes Visuais, Dança e Música (além das Artes Integradas).'],
  ['mundo', 'No Kabuki tradicional, os papéis femininos são feitos por homens (onnagata).', true, 'Os atores especializados em papéis femininos são chamados de onnagata.'],
  ['curiosidades', 'O nariz de palhaço é considerado, por muitos, a menor máscara do mundo.', true, 'É uma máscara mínima que revela o lado ingênuo do palhaço.'],
  ['curiosidades', 'O primeiro sinal avisa que o espetáculo já terminou.', false, 'Os sinais avisam que a peça vai começar; o terceiro marca o início.'],
];

// DIREÇÕES DE CENA: id da zona -> dica educativa
export const DIRECOES = [
  ['DA', 'Alta = fundo do palco (upstage). Direita e esquerda são sempre do ponto de vista do ATOR, que olha para a plateia.'],
  ['CA', 'O fundo é chamado de "alta" porque os palcos antigos eram inclinados: o fundo ficava mais alto que a frente.'],
  ['EA', 'Esquerda do palco = esquerda do ator, que olha para a plateia. Para quem assiste, é o lado direito.'],
  ['DM', 'Direita do palco = direita do ator. Para quem assiste, é o lado esquerdo.'],
  ['CM', 'O centro é uma posição forte, mas o diretor pode destacar um personagem em qualquer área do palco.'],
  ['EM', 'O diretor marca a posição dos atores no palco: isso se chama marcação de cena.'],
  ['DB', 'Baixa = frente do palco, perto da plateia (downstage).'],
  ['CB', 'Na frente do palco o ator fica mais próximo do público: é um lugar de destaque para falas importantes.'],
  ['EB', 'A faixa da frente do palco, perto da plateia, chama-se proscênio.'],
  ['XD', 'Coxia: espaço lateral escondido do público onde atores esperam a hora de entrar.'],
  ['XE', 'Atores entram e saem de cena pelas coxias, guiados pelas "deixas".'],
  ['PL', 'A plateia é onde o público assiste. No teatro participativo, o ator às vezes invade esse espaço!'],
];

// CENA RELÂMPAGO
export const IMPROV = {
  quem: ['um rei que perdeu a coroa', 'uma bruxa vegetariana', 'um dragão tímido', 'um detetive atrapalhado', 'uma princesa inventora', 'um pirata com medo do mar', 'uma professora com superpoderes', 'um fantasma que tem medo de gente', 'um robô apaixonado', 'um palhaço triste', 'um cavaleiro alérgico a cavalos', 'uma cantora de ópera rouca', 'um mágico sem truques', 'um explorador perdido no próprio bairro'],
  onde: ['numa floresta encantada', 'num castelo assombrado', 'num supermercado de madrugada', 'no fundo do mar', 'na Lua', 'dentro de um livro', 'no camarim antes da estreia', 'num trem a vapor', 'numa festa junina', 'numa biblioteca silenciosa', 'no meio de um ensaio geral'],
  conflito: ['perdeu o texto', 'o cenário está desabando', 'só pode falar sussurrando', 'descobriu que o vilão é seu melhor amigo', 'precisa pedir desculpas ao público', 'o tempo está acabando', 'uma tempestade chegou', 'alguém trocou todos os figurinos'],
  dicas: [
    'Improvisar é dizer "sim, e..." ao que o parceiro propõe: aceite a ideia e some algo novo.',
    'Na improvisação, o corpo conta tanto quanto a fala: postura, olhar e gesto já dizem quem é o personagem.',
    'Boas cenas têm quem, onde e conflito — exatamente os três ingredientes do sorteio desta rodada.',
    'Errar faz parte: no jogo teatral, o erro vira material para a cena.',
  ],
};

export const FALAS = [
  'Eu avisei que isso ia dar errado!', 'Quem deixou a porta aberta?', 'Meu reino por um lanche!', 'Isso não estava no roteiro!',
  'Silêncio... eles estão ouvindo.', 'Eu nasci para este papel!', 'Plateia, vocês viram isso?', 'Não olhe para trás!',
  'Tem alguém aí fora?', 'Hoje o espetáculo continua!', 'Prepare-se para o grande final!', 'Respire fundo. Você consegue.',
  'Era uma vez um problema muito grande...', 'Não tenho medo de nada! (só de um pouquinho)', 'Isso é um drama ou uma comédia?',
  'A cortina não pode fechar agora!', 'Todo o mundo é um palco!', 'Ser ou não ser, eis a questão!', 'Que entrem os bobos da corte!',
  'Um aplauso para os bastidores!', 'Eu sou a heroína desta história!', 'Cuidado com o vilão!', 'A plateia está rindo ou chorando?',
  'Vamos improvisar!', 'Respeitável público!', 'Quebrem a perna, meus amigos!', 'Alguém sabe a minha deixa?', 'O espetáculo não pode parar!',
];

export const BOT_NAMES = ['Arlequim', 'Colombina', 'Pantaleão', 'Puck', 'Julieta', 'Hamlet', 'Medeia', 'Pluft', 'Tartufo', 'Antígona', 'Cyrano', 'Ofélia', 'João Grilo', 'Chicó'];
