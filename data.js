"use strict";
/* Catálogo de exercícios
   t: w = carga+reps | r = reps | t = tempo (s) | c = carregar (kg + m) | k = cardio (min)
   img: slug das ilustrações (pasta ex/) | svg: animação própria (ver CUSTOM_SVG) */
const EX = {
  cat:{n:"Gato-camelo",img:"cat-cow-stretch",t:"r",m:["Coluna","Mobilidade"],yt:"gato camelo mobilidade coluna",cue:"Em quatro apoios, alterne arredondar e estender a coluna devagar, sem forçar o fim do movimento."},
  hipflex:{n:"Flexor do quadril",img:"kneeling-hip-flexor-stretch",t:"t",m:["Flexores do quadril"],yt:"alongamento flexor do quadril meio ajoelhado",cue:"Meio ajoelhado. Contraia o glúteo da perna de trás e leve o quadril à frente sem arquear a lombar. 30 s por lado."},
  openbook:{n:"Rotação torácica (open book)",svg:"openbook",t:"r",m:["Coluna torácica"],yt:"open book rotação torácica mobilidade",cue:"Deitado de lado, joelhos a 90°. Abra o braço de cima acompanhando com o olhar. Gire a parte de cima das costas, não a lombar."},
  hip9090:{n:"90/90 de quadril",svg:"hip9090",t:"r",m:["Quadril"],yt:"90 90 mobilidade quadril",cue:"Sentado com as duas pernas em 90°, gire os joelhos de um lado para o outro mantendo o tronco alto."},
  curlup:{n:"Curl-up de McGill",svg:"curlup",t:"r",m:["Reto abdominal","Estabilidade"],yt:"curl up McGill big 3",cue:"Deitado, uma perna dobrada, mãos sob a lombar. Eleve só cabeça e ombros alguns centímetros e segure 8 s. A lombar não se mexe."},
  sideplank:{n:"Prancha lateral",img:"side-plank",t:"t",m:["Quadrado lombar","Oblíquos"],yt:"prancha lateral McGill",cue:"Apoio no antebraço e nos joelhos (ou pés), corpo em linha reta, quadril alto. Respire normalmente. Faça os dois lados."},
  birddog:{n:"Bird dog",img:"bird-dog",t:"r",m:["Eretores","Glúteo","Estabilidade"],yt:"bird dog exercício McGill",cue:"Em quatro apoios, estenda braço e perna opostos e segure 8 s sem girar o quadril nem arquear a lombar."},
  suitcase:{n:"Carregamento unilateral",img:"farmer-carry",t:"c",m:["Quadrado lombar","Oblíquos","Pegada"],yt:"suitcase carry exercício",cue:"Peso em UMA mão só (a ilustração mostra as duas). Caminhe com o tronco reto, sem inclinar para o lado do peso. Troque de mão."},
  pallof:{n:"Pallof press",img:"pallof-press",t:"w",m:["Core","Anti-rotação"],yt:"pallof press execução",cue:"De lado para a polia, mãos no peito. Estenda os braços resistindo à rotação, segure 2 s e volte."},
  deadbug:{n:"Dead bug",img:"dead-bug",t:"r",m:["Core profundo"],yt:"dead bug exercício execução",cue:"Deitado, braços para cima e joelhos a 90°. Estenda braço e perna opostos devagar mantendo a lombar colada no chão."},
  incDb:{n:"Supino inclinado halteres",img:"incline-dumbbell-press",t:"w",m:["Peitoral superior","Ombro","Tríceps"],yt:"supino inclinado com halteres execução",cue:"Banco a ~30°, escápulas encaixadas, desça até a linha do peito, pés firmes no chão."},
  machBench:{n:"Supino máquina",img:"machine-chest-press",t:"w",m:["Peitoral","Tríceps"],yt:"supino máquina execução",cue:"Ajuste o banco para a pegada ficar na linha do meio do peito. Costas apoiadas o tempo todo."},
  machShoulder:{n:"Desenvolvimento máquina",img:"machine-shoulder-press",t:"w",m:["Ombro","Tríceps"],yt:"desenvolvimento máquina sentado execução",cue:"Costas coladas no encosto. Não arqueie a lombar para empurrar."},
  latRaise:{n:"Elevação lateral",img:"lateral-raise",t:"w",m:["Deltoide lateral"],yt:"elevação lateral halteres execução",cue:"Cotovelos levemente flexionados, suba até a altura do ombro sem balançar o tronco."},
  rope:{n:"Tríceps corda",img:"rope-tricep-pushdown",t:"w",m:["Tríceps"],yt:"tríceps corda polia execução",cue:"Cotovelos colados ao corpo, abra a corda no final do movimento."},
  legPress:{n:"Leg press 45°",img:"leg-press",t:"w",m:["Quadríceps","Glúteo"],yt:"leg press 45 execução correta lombar",cue:"Desça só até o ponto em que o quadril ainda não descola do banco. A lombar fica apoiada o tempo todo."},
  split:{n:"Búlgaro com halteres",img:"bulgarian-split-squat",t:"w",m:["Quadríceps","Glúteo"],yt:"agachamento búlgaro halteres execução",cue:"Pé de trás no banco, tronco levemente à frente, desça controlando o joelho da frente. Registre a carga de cada halter."},
  legExt:{n:"Cadeira extensora",img:"leg-extension",t:"w",m:["Quadríceps"],yt:"cadeira extensora execução",cue:"Controle a descida em 2–3 s, segure 1 s no topo."},
  adductor:{n:"Cadeira adutora",img:"hip-adduction-machine",t:"w",m:["Adutores"],yt:"cadeira adutora execução",cue:"Movimento controlado, sem bater as placas."},
  seatedCalf:{n:"Panturrilha sentado",img:"seated-calf-raise",t:"w",m:["Sóleo"],yt:"panturrilha sentado execução",cue:"Amplitude total: alongue embaixo, segure 1 s em cima."},
  latPull:{n:"Puxada frontal",img:"lat-pulldown",t:"w",m:["Dorsal","Bíceps"],yt:"puxada frontal execução",cue:"Peito alto, puxe a barra até a parte de cima do peito sem jogar o tronco para trás."},
  chestRow:{n:"Remada com peito apoiado",img:"chest-supported-row",t:"w",m:["Dorsal","Romboides"],yt:"remada com apoio no peito execução",cue:"Peito apoiado no banco ou na máquina, o que tira a carga da lombar. Puxe com os cotovelos."},
  dbRow:{n:"Remada unilateral",img:"one-arm-dumbbell-row",t:"w",m:["Dorsal"],yt:"remada unilateral halter execução",cue:"Mão e joelho no banco, coluna neutra, puxe o halter em direção ao quadril."},
  facePull:{n:"Face pull",img:"face-pull",t:"w",m:["Deltoide posterior","Manguito"],yt:"face pull execução",cue:"Corda na altura do rosto. Puxe abrindo as mãos e rodando os ombros para fora."},
  dbCurl:{n:"Rosca com halteres",img:"bicep-curl",t:"w",m:["Bíceps"],yt:"rosca direta halteres execução",cue:"Cotovelos fixos, sem balançar o tronco."},
  hammer:{n:"Rosca martelo",img:"hammer-curl",t:"w",m:["Braquial","Bíceps"],yt:"rosca martelo execução",cue:"Pegada neutra, cotovelos fixos."},
  hipThrust:{n:"Elevação pélvica",img:"hip-thrust",t:"w",m:["Glúteo"],yt:"elevação pélvica hip thrust execução",cue:"Escápulas no banco, queixo levemente para dentro. Suba contraindo o glúteo, sem arquear a lombar no topo."},
  lyingCurl:{n:"Mesa flexora",img:"lying-leg-curl",t:"w",m:["Posteriores de coxa"],yt:"mesa flexora execução",cue:"Quadril colado no banco, controle a descida."},
  seatedCurl:{n:"Cadeira flexora",img:"seated-leg-curl",t:"w",m:["Posteriores de coxa"],yt:"cadeira flexora execução",cue:"Costas apoiadas, controle a volta."},
  backExt:{n:"Extensão 45°",img:"glute-focused-back-extension",t:"r",m:["Glúteo","Eretores"],yt:"extensão lombar 45 graus glúteo execução",cue:"Só o peso do corpo. Suba até alinhar o tronco com as pernas, sem passar disso. Confirme com sua fisioterapeuta."},
  abductor:{n:"Cadeira abdutora",img:"hip-abduction-machine",t:"w",m:["Glúteo médio"],yt:"cadeira abdutora execução",cue:"Tronco apoiado, abra com controle e segure 1 s."},
  lpCalf:{n:"Panturrilha no leg press",img:"leg-press-calf-raise",t:"w",m:["Gastrocnêmio"],yt:"panturrilha no leg press execução",cue:"Só a ponta dos pés na plataforma, amplitude total."},
  cableRow:{n:"Remada baixa",img:"seated-row",t:"w",m:["Dorsal","Romboides"],yt:"remada baixa polia execução",cue:"Tronco parado e reto. Puxe com os cotovelos sem balançar."},
  incMach:{n:"Supino inclinado",img:"incline-bench-press",t:"w",m:["Peitoral superior"],yt:"supino inclinado máquina execução",cue:"Na máquina ou no smith. Costas apoiadas, empurre sem tirar as escápulas do banco."},
  neutralPull:{n:"Puxada pegada neutra",img:"close-grip-lat-pulldown",t:"w",m:["Dorsal"],yt:"puxada triângulo pegada neutra execução",cue:"Triângulo, puxe até o peito mantendo o tronco estável."},
  cableLat:{n:"Elevação lateral no cabo",img:"cable-lateral-raise",t:"w",m:["Deltoide lateral"],yt:"elevação lateral no cabo execução",cue:"Suba até a altura do ombro, sem balançar o tronco."},
  cardio:{n:"Cardio zona 2",img:"treadmill-incline-walk",t:"k",m:["Cardio"],yt:"treino zona 2 o que é",cue:"Ritmo em que você ainda consegue conversar. Esteira inclinada ou elíptico; bicicleta só se não doer."}
};

// [chave, séries, alvo, descanso(s)]
const MOB = [["cat",1,"8 reps",0],["hipflex",2,"30 s/lado",0],["openbook",1,"6/lado",0],["hip9090",1,"5/lado",0]];
const CORE = {
  1:[["curlup",3,"5 × 8 s",45],["sideplank",3,"20–30 s/lado",45],["birddog",3,"6/lado × 8 s",45]],
  2:[["suitcase",3,"30 m/lado",60],["pallof",3,"10/lado",45],["deadbug",3,"8/lado",45]]
};
const DAYS = [
  {id:"A",wd:1,dia:"Seg",nome:"Peito, ombro e tríceps",tag:"Empurrar",core:1,main:[["incDb",3,"8–10",90],["machBench",3,"10–12",90],["machShoulder",3,"10",90],["latRaise",3,"12–15",60],["rope",3,"12",60]]},
  {id:"B",wd:2,dia:"Ter",nome:"Pernas · quadríceps",tag:"Pernas",core:2,main:[["legPress",4,"10",120],["split",3,"8/perna",90],["legExt",3,"12–15",60],["adductor",3,"12",60],["seatedCalf",3,"15",45]]},
  {id:"C",wd:3,dia:"Qua",nome:"Costas e bíceps",tag:"Puxar",core:1,main:[["latPull",3,"10",90],["chestRow",3,"10",90],["dbRow",3,"10",75],["facePull",3,"15",60],["dbCurl",3,"10",60],["hammer",2,"12",60]]},
  {id:"D",wd:4,dia:"Qui",nome:"Posterior e glúteo",tag:"Pernas",core:2,main:[["hipThrust",4,"8–10",120],["lyingCurl",3,"10–12",75],["seatedCurl",3,"12",60],["backExt",3,"12",60],["abductor",3,"15",45],["lpCalf",3,"15",45]]},
  {id:"E",wd:5,dia:"Sex",nome:"Superiores completo",tag:"Full upper",core:1,main:[["cableRow",3,"10",90],["incMach",3,"10",90],["neutralPull",3,"10",90],["cableLat",3,"12",60],["dbCurl",3,"12",45],["rope",3,"12",45]]}
];

/* Animações próprias (traço branco, CSS) para exercícios sem ilustração aberta */
const SVG_HEAD = (vb) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">`;
const CUSTOM_SVG = {
  curlup: SVG_HEAD("50 250 440 210") +
    '<path d="M40 420H472" stroke-width="3" opacity=".25"/>' +
    '<path d="M268 386L346 304L410 392" stroke-width="13"/><path d="M268 386L466 396" stroke-width="13"/>' +
    '<path d="M268 386L205 390" stroke-width="22"/>' +
    '<g class="cs-cu"><path d="M205 390L142 384" stroke-width="22"/><path d="M142 384L176 402L232 398" stroke-width="10"/><circle cx="100" cy="374" r="26" stroke-width="9"/></g>' +
    '</svg>',
  openbook: SVG_HEAD("40 190 430 260") +
    '<path d="M60 430H452" stroke-width="3" opacity=".25"/>' +
    '<path d="M330 360L300 420L410 420" stroke-width="13"/>' +
    '<path d="M152 368L330 360" stroke-width="22"/>' +
    '<path d="M150 378L172 424L250 424" stroke-width="10"/>' +
    '<g class="cs-ob"><path d="M152 366L215 404L280 400" stroke-width="10"/></g>' +
    '<g class="cs-obh"><circle cx="104" cy="358" r="26" stroke-width="9"/></g>' +
    '</svg>',
  hip9090: SVG_HEAD("70 100 372 350") +
    '<path d="M40 430H472" stroke-width="3" opacity=".25"/>' +
    '<circle cx="256" cy="150" r="26" stroke-width="9"/>' +
    '<path d="M256 190L256 330" stroke-width="22"/>' +
    '<path d="M256 206L210 266L218 316M256 206L302 266L294 316" stroke-width="10"/>' +
    '<g class="cs-pa"><path d="M246 336L122 372L172 424" stroke-width="13"/><path d="M266 336L322 412L212 420" stroke-width="13"/></g>' +
    '<g class="cs-pb"><path d="M244 336L190 412L300 420" stroke-width="13"/><path d="M266 336L390 372L340 424" stroke-width="13"/></g>' +
    '</svg>'
};
