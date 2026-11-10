# Ascensão ao Olimpo — Referência de correspondências

Arquivo gerado por `npm run reference` a partir do código em `src/engine`. Não edite à mão:
altere os dados no motor e gere de novo.

## 1. Parâmetros gerais

| Parâmetro | Valor |
|---|---|
| Jogadores | 2 a 4, humanos e/ou IA |
| Glória para vencer | 20 |
| Cartas na mão | 6 |
| Recursos iniciais | 5 Dracmas, 1 Favor, 0 Húbris, 0 Glória |
| Teto de Favor | 10 |
| Relíquias por jogador | 2 |
| Eleição do Oráculo | a cada 6 rodadas |
| Evento global | a cada 6 rodadas, após a eleição (Ligado) |
| Teto de Dracmas de passagem | 4 por movimento |
| Ira de Nêmesis | encerrar o turno com 6+ de Húbris leva ao Tártaro; a Húbris cai para 4 |
| Suborno no Tártaro | 4 Dracmas |
| Multa de Nêmesis (Húbris 4–5) | 4 Dracmas |
| Aposta máxima em duelo | 3 Favores |
| Ascensão de Zeus | 1 vez a cada 3 rodadas por jogador |
| Armadilhas | 2 por jogador, 3 rodadas (Ligado) |
| Sabotagens recebidas | no máximo 2 por rodada |
| Sabotagem direta | Desligado |
| Contratos divinos | Desligado; abandonar custa 2 Dracmas |

## 2. Recursos

| Recurso | Para que serve |
|---|---|
| Glória | Pontos de vitória: vence quem chegar a 20. |
| Dracmas | Pagam efeitos de cartas, ações de templo, relíquias, armadilhas, pedágios e o suborno do Tártaro. |
| Favor | Votos na eleição do Oráculo (não é gasto), apostas em duelos e algumas ações. Máximo 10. |
| Húbris | Risco acumulado: é cobrada em Nêmesis e pode levar ao Tártaro. |

## 3. Elementos e naipes

| Elemento | Naipe | Signos | Deuses (templos do elemento) |
|---|---|---|---|
| Fogo | Paus | Áries, Leão, Sagitário | Zeus, Ares, Hefesto |
| Água | Copas | Câncer, Escorpião, Peixes | Dionísio, Afrodite, Poseidon |
| Ar | Espadas | Gêmeos, Libra, Aquário | Apolo, Atena, Hermes |
| Terra | Ouros | Touro, Virgem, Capricórnio | Hera, Ártemis, Deméter |

Cartas do naipe do elemento do seu signo custam 1 Dracma a menos no efeito (mínimo 0).

## 4. Personagens: signos

| Signo | Glifo | Elemento | Naipe com desconto | Deus patrono | Casa inicial |
|---|---|---|---|---|---|
| Áries | ♈ | Fogo | Paus | Ares | 43 |
| Touro | ♉ | Terra | Ouros | Hera | 11 |
| Gêmeos | ♊ | Ar | Espadas | Hermes | 67 |
| Câncer | ♋ | Água | Copas | Afrodite | 83 |
| Leão | ♌ | Fogo | Paus | Zeus | 03 |
| Virgem | ♍ | Terra | Ouros | Deméter | 75 |
| Libra | ♎ | Ar | Espadas | Atena | 35 |
| Escorpião | ♏ | Água | Copas | Dionísio | 59 |
| Sagitário | ♐ | Fogo | Paus | Hefesto | 51 |
| Capricórnio | ♑ | Terra | Ouros | Ártemis | 27 |
| Aquário | ♒ | Ar | Espadas | Apolo | 19 |
| Peixes | ♓ | Água | Copas | Poseidon | 91 |

A tabela signo–patrono é provisória. O patrono define apenas a casa inicial.

## 5. Deuses, regiões e templos

| Região | Deus | Elemento | Casas | Templo | Signos patrocinados |
|---|---|---|---|---|---|
| 1 | Zeus | Fogo | 00–07 | 03 | Leão |
| 2 | Hera | Terra | 08–15 | 11 | Touro |
| 3 | Apolo | Ar | 16–23 | 19 | Aquário |
| 4 | Ártemis | Terra | 24–31 | 27 | Capricórnio |
| 5 | Atena | Ar | 32–39 | 35 | Libra |
| 6 | Ares | Fogo | 40–47 | 43 | Áries |
| 7 | Hefesto | Fogo | 48–55 | 51 | Sagitário |
| 8 | Dionísio | Água | 56–63 | 59 | Escorpião |
| 9 | Hermes | Ar | 64–71 | 67 | Gêmeos |
| 10 | Deméter | Terra | 72–79 | 75 | Virgem |
| 11 | Afrodite | Água | 80–87 | 83 | Câncer |
| 12 | Poseidon | Água | 88–95 | 91 | Peixes |

## 6. Ações dos templos

Só ao **chegar** ao templo por movimento. O jogador escolhe uma opção: ação principal, ação secundária, relíquia, efeito de carta permitida ali, ou nada.

| Deus | Ação principal | Efeito | Ação secundária | Efeito |
|---|---|---|---|---|
| Zeus | Ascensão | 6 Dracmas → +2 Glórias e +1 Húbris. Uma vez a cada 3 rodadas. | Decreto Olímpico | 3 Favores → +1 Glória. |
| Hera | Influência | 2 Favores → 4 Dracmas, ou 5 Dracmas → 2 Favores. | Proteção Real | 2 Favores → escudo contra a próxima perda de Glória. |
| Apolo | Visão Profética | 2 Dracmas → ver 3 cartas do Destino e reorganizá-las. | Purificação | 3 Dracmas → remover 2 Húbris. |
| Ártemis | Caçada | Grátis: 1d6, ganha de 1 a 5 Dracmas. Resultado 1: +1 Húbris. | Caça Sagrada | 2 Dracmas → comprar 2 cartas e descartar 2. |
| Atena | Julgamento | 3 Dracmas → disputar no dado 2 Favores de um adversário. Falha: +1 Húbris. | Estratégia | 2 Favores → ver 3 cartas do Destino e reorganizá-las. |
| Ares | Confronto | 2 Dracmas e 1 Favor → duelo à distância valendo 1 Glória. | Preparação de Guerra | 2 Dracmas → +2 de força no próximo duelo. |
| Hefesto | Forja | 5 Dracmas → +1 Dracma ao fim de cada rodada, até render 8. | Aprimoramento | 3 Dracmas → a próxima carta divina custa −1. |
| Dionísio | Êxtase | Grátis: +5 Dracmas, +2 Húbris e troca a mão inteira por 6 cartas novas. | Cassino Divino | Aposte 1–3 Dracmas: com 4, 5 ou 6 no dado, recebe o dobro. |
| Hermes | Comércio | Vender 1 Glória por 5 Dracmas, ou 3 Dracmas → 1 Favor. | Contrabando | 2 Dracmas → trocar até 3 cartas da mão. |
| Deméter | Colheita | 4 Dracmas → +2 Dracmas por rodada durante 4 rodadas. | Oferta da Terra | 3 Dracmas → +2 Favores. |
| Afrodite | Persuasão | 3 Dracmas → +2 Favores. | Encantamento | 2 Favores → tomar 3 Dracmas de um adversário que os tenha. |
| Poseidon | Tesouro Submerso | Grátis: 1d6, ganha de 2 a 7 Dracmas. Resultado 1: +1 Húbris. | Travessia | 3 Dracmas → teletransporte para uma casa comum da região seguinte. |

Ações políticas adicionais (v1.9):

| Templo | Ação | Custo | Efeito |
|---|---|---|---|
| Hera | Campanha | 3 Dracmas | +1 Favor |
| Atena | Intriga | 3 Dracmas | Um adversário perde 1 Favor (conta como sabotagem política) |
| Zeus | Decreto de Proteção | 2 Favores | Anula a próxima sabotagem política contra você, até a eleição |

## 7. Relíquias

| Relíquia | Templo | Preço | Efeito |
|---|---|---|---|
| Raio de Zeus | Zeus | 8 | Uma vez por partida: +3 Glórias e +2 Húbris; consumido. |
| Coroa de Hera | Hera | 6 | +1 voto em eleição. |
| Lira de Apolo | Apolo | 5 | Consulta a próxima carta do Destino, 1 vez/rodada. |
| Arco de Ártemis | Ártemis | 6 | Ignora um efeito negativo de casa, 1 vez/rodada. |
| Égide de Atena | Atena | 6 | Ignora a próxima perda de Glória, 1 vez/rodada. |
| Lança de Ares | Ares | 6 | +1 força nos duelos. |
| Martelo de Hefesto | Hefesto | 7 | −1 Dracma na primeira carta divina/rodada. |
| Taça de Dionísio | Dionísio | 5 | Troca 1 Húbris por 2 Dracmas, 1 vez/rodada. |
| Sandálias de Hermes | Hermes | 7 | Altera o movimento em +1 ou −1, 1 vez/rodada; mínimo 1. |
| Foice de Deméter | Deméter | 5 | +1 Dracma no início de cada rodada. |
| Cinto de Afrodite | Afrodite | 6 | +1 Favor a cada 3 rodadas. |
| Tridente de Poseidon | Poseidon | 6 | +1 Dracma ao entrar em região nova; máximo 2/rodada. |

## 8. Tipos de casa

| Tipo | Qtde. | Passagem | Parada | IDs |
|---|---|---|---|---|
| Comum | 12 | — | Nenhum efeito. | 00, 02, 05, 09, 13, 18, 21, 24, 28, 32, 37, 40 |
| Dracmas | 10 | +1 Dracma | +2 Dracmas | 01, 12, 20, 31, 39, 49, 58, 71, 78, 84 |
| Pedágio divino | 8 | −1 Dracma | −2 Dracmas. Sem saldo: paga o que tiver e ganha 1 Húbris | 42, 47, 50, 57, 60, 63, 66, 72 |
| Favor | 8 | — | +2 Favores | 04, 16, 23, 34, 41, 55, 61, 74 |
| Glória | 6 | +1 Glória | +2 Glórias | 07, 15, 25, 33, 44, 53 |
| Provação | 6 | — | 1d6: 1 +2 Húbris · 2 −2 Dracmas · 3 −1 Favor · 4 +2 Dracmas · 5 +1 Glória · 6 +1 Favor e +1 Dracma | 77, 79, 80, 81, 85, 87 |
| Destino | 6 | — | Revela um Arcano Maior | 10, 29, 48, 69, 82, 93 |
| Nêmesis | 4 | Com Húbris ≥ 4: −1 Dracma | Julgamento. Húbris 0–1: nada · 2–3: −2 Dracmas · 4–5: paga 4 Dracmas ou Tártaro · 6+: Tártaro | 14, 30, 46, 62 |
| Bifurcação | 6 | Escolha de rota: saída normal ou atalho para dentro | Nenhum efeito. | 06, 22, 38, 54, 70, 86 |
| Templo | 12 | — | Ação divina (só ao chegar por movimento), comprar a relíquia ou nada | 03, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91 |
| Evento | 6 | — | 1d6: 1 −2 Dracmas · 2 +2 Dracmas · 3 +1 Favor · 4 +1 Húbris · 5 −1 Húbris · 6 +1 Glória | 08, 17, 26, 36, 45, 56 |
| Altar | 6 | — | Aposte de 1 a 3 Dracmas e role 1d6, +1 por Dracma além do primeiro: 1–2 nada · 3–4 +1 Favor · 5 ou mais +2 Favores | 65, 76, 89, 90, 92, 95 |
| Tesouro | 4 | — | +2 a 5 Dracmas | 64, 73, 88, 94 |
| Delfos | 1 | — | Ver 2 cartas do Destino, ou pagar 2 Dracmas por 1 Favor, ou pagar 3 para comprar 2 e descartar 2 | 68 |
| Tártaro | 1 | — | Entrada comum, sem prisão. A prisão exige condenação. | 52 |

## 9. Tabelas de dado

**Provação (1d6)**

| Dado | Efeito |
|---|---|
| 1 | +2 Húbris |
| 2 | −2 Dracmas |
| 3 | −1 Favor |
| 4 | +2 Dracmas |
| 5 | +1 Glória |
| 6 | +1 Favor e +1 Dracma |

**Evento (1d6)**

| Dado | Efeito |
|---|---|
| 1 | perde 2 Dracmas |
| 2 | ganha 2 Dracmas |
| 3 | ganha 1 Favor |
| 4 | ganha 1 Húbris |
| 5 | remove 1 Húbris |
| 6 | ganha 1 Glória |

**Altar** — aposta de 1 a 3 Dracmas; cada Dracma além do primeiro soma 1 ao dado.

| Total | Resultado |
|---|---|
| 1–2 | Perde a aposta |
| 3–4 | +1 Favor |
| 5 ou mais | +2 Favores |

**Tesouro** — +2 a 5 Dracmas, sorteio uniforme.

**Caçada de Ártemis (1d6)** — ganha o valor do dado em Dracmas, limitado a 5. Resultado 1: +1 Húbris.

**Tesouro Submerso de Poseidon (1d6)** — ganha dado + 1 Dracmas (2 a 7). Resultado 1: +1 Húbris.

**Cassino Divino de Dionísio (1d6)** — aposta de 1 a 3 Dracmas. Com 4, 5 ou 6 recebe o dobro; com 1 a 3 perde.

**Julgamento de Atena** — cada lado rola 1d6. Se quem age tirar mais, toma até 2 Favores; senão, +1 Húbris.

## 10. Nêmesis e Tártaro

| Situação | Efeito |
|---|---|
| Passar por Nêmesis com Húbris ≥ 4 | Paga 1 Dracma; sem saldo, +1 Húbris |
| Parar em Nêmesis com Húbris 0–1 | Nada |
| Parar em Nêmesis com Húbris 2–3 | Perde até 2 Dracmas |
| Parar em Nêmesis com Húbris 4–5 | Paga 4 Dracmas ou vai ao Tártaro |
| Parar em Nêmesis com Húbris 6+ | Tártaro |
| Encerrar o turno com Húbris 6+ | Tártaro; a Húbris cai para 4 |
| Tártaro: Penitência | Perde a ação, remove 2 Húbris e sai ao fim do turno |
| Tártaro: Suborno | Paga 4 Dracmas, sai e age |
| Tártaro: Pacto Sombrio | Perde 1 Glória, ganha 2 Húbris, sai e age |

## 11. Mapa: as 96 casas

| Casa | Região | Tipo | Saídas |
|---|---|---|---|
| 00 | Zeus | Comum | 01 |
| 01 | Zeus | Dracmas | 02 |
| 02 | Zeus | Comum | 03 |
| 03 | Zeus | **Templo de Zeus** | 04 |
| 04 | Zeus | Favor | 05 |
| 05 | Zeus | Comum | 06 |
| 06 | Zeus | Bifurcação | 07, 32 (atalho) |
| 07 | Zeus | Glória | 08 |
| 08 | Hera | Evento | 09 |
| 09 | Hera | Comum | 10 |
| 10 | Hera | Destino | 11 |
| 11 | Hera | **Templo de Hera** | 12 |
| 12 | Hera | Dracmas | 13 |
| 13 | Hera | Comum | 14 |
| 14 | Hera | Nêmesis | 15 |
| 15 | Hera | Glória | 16 |
| 16 | Apolo | Favor | 17 |
| 17 | Apolo | Evento | 18 |
| 18 | Apolo | Comum | 19 |
| 19 | Apolo | **Templo de Apolo** | 20 |
| 20 | Apolo | Dracmas | 21 |
| 21 | Apolo | Comum | 22 |
| 22 | Apolo | Bifurcação | 23, 48 (atalho) |
| 23 | Apolo | Favor | 24 |
| 24 | Ártemis | Comum | 25 |
| 25 | Ártemis | Glória | 26 |
| 26 | Ártemis | Evento | 27 |
| 27 | Ártemis | **Templo de Ártemis** | 28 |
| 28 | Ártemis | Comum | 29, 02 (retorno) |
| 29 | Ártemis | Destino | 30 |
| 30 | Ártemis | Nêmesis | 31 |
| 31 | Ártemis | Dracmas | 32 |
| 32 | Atena | Comum | 33 |
| 33 | Atena | Glória | 34 |
| 34 | Atena | Favor | 35 |
| 35 | Atena | **Templo de Atena** | 36 |
| 36 | Atena | Evento | 37 |
| 37 | Atena | Comum | 38 |
| 38 | Atena | Bifurcação | 39, 64 (atalho) |
| 39 | Atena | Dracmas | 40, 13 (retorno) |
| 40 | Ares | Comum | 41 |
| 41 | Ares | Favor | 42 |
| 42 | Ares | Pedágio divino | 43 |
| 43 | Ares | **Templo de Ares** | 44 |
| 44 | Ares | Glória | 45 |
| 45 | Ares | Evento | 46 |
| 46 | Ares | Nêmesis | 47 |
| 47 | Ares | Pedágio divino | 48 |
| 48 | Hefesto | Destino | 49 |
| 49 | Hefesto | Dracmas | 50 |
| 50 | Hefesto | Pedágio divino | 51 |
| 51 | Hefesto | **Templo de Hefesto** | 52 |
| 52 | Hefesto | Tártaro | 53 |
| 53 | Hefesto | Glória | 54 |
| 54 | Hefesto | Bifurcação | 55, 80 (atalho) |
| 55 | Hefesto | Favor | 56 |
| 56 | Dionísio | Evento | 57 |
| 57 | Dionísio | Pedágio divino | 58 |
| 58 | Dionísio | Dracmas | 59 |
| 59 | Dionísio | **Templo de Dionísio** | 60 |
| 60 | Dionísio | Pedágio divino | 61, 34 (retorno) |
| 61 | Dionísio | Favor | 62 |
| 62 | Dionísio | Nêmesis | 63 |
| 63 | Dionísio | Pedágio divino | 64 |
| 64 | Hermes | Tesouro | 65 |
| 65 | Hermes | Altar | 66 |
| 66 | Hermes | Pedágio divino | 67 |
| 67 | Hermes | **Templo de Hermes** | 68 |
| 68 | Hermes | Delfos | 69 |
| 69 | Hermes | Destino | 70 |
| 70 | Hermes | Bifurcação | 71, 00 (atalho) |
| 71 | Hermes | Dracmas | 72, 45 (retorno) |
| 72 | Deméter | Pedágio divino | 73 |
| 73 | Deméter | Tesouro | 74 |
| 74 | Deméter | Favor | 75 |
| 75 | Deméter | **Templo de Deméter** | 76 |
| 76 | Deméter | Altar | 77 |
| 77 | Deméter | Provação | 78 |
| 78 | Deméter | Dracmas | 79 |
| 79 | Deméter | Provação | 80 |
| 80 | Afrodite | Provação | 81 |
| 81 | Afrodite | Provação | 82 |
| 82 | Afrodite | Destino | 83 |
| 83 | Afrodite | **Templo de Afrodite** | 84 |
| 84 | Afrodite | Dracmas | 85, 58 (retorno) |
| 85 | Afrodite | Provação | 86 |
| 86 | Afrodite | Bifurcação | 87, 16 (atalho) |
| 87 | Afrodite | Provação | 88 |
| 88 | Poseidon | Tesouro | 89 |
| 89 | Poseidon | Altar | 90 |
| 90 | Poseidon | Altar | 91 |
| 91 | Poseidon | **Templo de Poseidon** | 92 |
| 92 | Poseidon | Altar | 93, 66 (retorno) |
| 93 | Poseidon | Destino | 94 |
| 94 | Poseidon | Tesouro | 95 |
| 95 | Poseidon | Altar | 00 |

## 12. Bifurcações e retornos

Atalhos (levam à volta de dentro da espiral, ou de volta ao início):

| Origem | Saída normal | Atalho |
|---|---|---|
| 06 | 07 | 32 |
| 22 | 23 | 48 |
| 38 | 39 | 64 |
| 54 | 55 | 80 |
| 70 | 71 | 00 |
| 86 | 87 | 16 |

Retornos (levam à volta de fora; fecham anéis de 27 passos):

| Origem | Tipo da casa | Saída normal | Retorno |
|---|---|---|---|
| 28 | Comum | 29 | 02 |
| 39 | Dracmas | 40 | 13 |
| 60 | Pedágio divino | 61 | 34 |
| 71 | Dracmas | 72 | 45 |
| 84 | Dracmas | 85 | 58 |
| 92 | Altar | 93 | 66 |

## 13. Arcanos Menores (56 cartas)

Cada carta serve para **mover** (descarta e anda exatamente o movimento) ou para o **efeito** (paga o custo, não move). U = universal, E = elemental, D = divina.

### Paus — Fogo

| Carta | Mov. | Custo | Uso | Templos onde o efeito vale | Efeito | Sabotagem |
|---|---|---|---|---|---|---|
| Ás de Paus | 1 | 0 | Universal | Qualquer casa | Ganhe 1 Glória. | — |
| 2 de Paus | 2 | 1 | Universal | Qualquer casa | Ganhe 2 Dracmas e 1 Húbris. | — |
| 3 de Paus | 3 | 1 | Universal | Qualquer casa | Transfira até 1 Dracma de um adversário para você. | roubo |
| 4 de Paus | 4 | 2 | Universal | Qualquer casa | Ganhe 2 Glórias e 1 Húbris. | — |
| 5 de Paus | 5 | 2 | Universal | Qualquer casa | Um adversário perde até 1 Favor; você ganha 1 Húbris. | politica |
| 6 de Paus | 6 | 2 | Universal | Qualquer casa | Ganhe 3 Dracmas e 1 Húbris. | — |
| 7 de Paus | 1 | 3 | Elemental | Zeus, Ares, Hefesto | Ganhe 3 Glórias e 2 Húbris. | — |
| 8 de Paus | 2 | 3 | Elemental | Zeus, Ares, Hefesto | Ganhe 2 Glórias; adversário perde até 1 Glória. | ataque |
| 9 de Paus | 3 | 3 | Elemental | Zeus, Ares, Hefesto | Ganhe 2 Glórias; com 3+ Húbris, ganhe mais 1. | — |
| 10 de Paus | 4 | 3 | Elemental | Zeus, Ares, Hefesto | Ganhe 4 Glórias e 2 Húbris. | — |
| Pajem de Paus | 2 | 2 | Elemental | Zeus, Ares, Hefesto, Ártemis | Remova 1 Húbris ou ganhe 1 Dracma. | — |
| Cavaleiro de Paus | 5 | 3 | Divina: Ares | Ares, Ártemis | Roube até 3 Dracmas; ganhe 1 Húbris. | roubo |
| Rainha de Paus | 3 | 4 | Divina: Hefesto | Hefesto | Ganhe 2 Glórias e um escudo para a próxima perda de Glória. | — |
| Rei de Paus | 6 | 5 | Divina: Zeus | Zeus | Ganhe 5 Glórias e 2 Húbris. | — |

### Copas — Água

| Carta | Mov. | Custo | Uso | Templos onde o efeito vale | Efeito | Sabotagem |
|---|---|---|---|---|---|---|
| Ás de Copas | 1 | 0 | Universal | Qualquer casa | Ganhe 1 Favor. | — |
| 2 de Copas | 2 | 1 | Universal | Qualquer casa | Remova 1 Húbris. | — |
| 3 de Copas | 3 | 1 | Universal | Qualquer casa | Ganhe 2 Dracmas. | — |
| 4 de Copas | 4 | 2 | Universal | Qualquer casa | Ganhe 2 Favores. | — |
| 5 de Copas | 5 | 2 | Universal | Qualquer casa | Remova até 2 Húbris. | — |
| 6 de Copas | 6 | 2 | Universal | Qualquer casa | Ganhe 1 Favor e 1 Dracma. | — |
| 7 de Copas | 1 | 3 | Elemental | Dionísio, Afrodite, Poseidon | Ganhe 3 Favores. | — |
| 8 de Copas | 2 | 3 | Elemental | Dionísio, Afrodite, Poseidon | Remova até 3 Húbris e ganhe 1 Favor. | — |
| 9 de Copas | 3 | 3 | Elemental | Dionísio, Afrodite, Poseidon | Ganhe 2 Favores e 1 Glória. | — |
| 10 de Copas | 4 | 3 | Elemental | Dionísio, Afrodite, Poseidon | Ganhe 2 Glórias e remova até 2 Húbris. | — |
| Pajem de Copas | 2 | 2 | Elemental | Dionísio, Afrodite, Poseidon | Compre 1 carta e descarte 1. | — |
| Cavaleiro de Copas | 5 | 3 | Divina: Poseidon | Poseidon | Mova um adversário até 3 casas adiante, sem ativar o destino. | deslocamento |
| Rainha de Copas | 3 | 4 | Divina: Afrodite | Afrodite, Hera | Ganhe 2 Favores e 2 Glórias. | — |
| Rei de Copas | 6 | 5 | Divina: Dionísio | Dionísio, Poseidon | Ganhe 4 Glórias e 2 Húbris; remova 1 Húbris. | — |

### Espadas — Ar

| Carta | Mov. | Custo | Uso | Templos onde o efeito vale | Efeito | Sabotagem |
|---|---|---|---|---|---|---|
| Ás de Espadas | 1 | 0 | Universal | Qualquer casa | Olhe 2 cartas do baralho de jogadores e reorganize. | — |
| 2 de Espadas | 2 | 1 | Universal | Qualquer casa | Compre 1 carta e descarte 1. | — |
| 3 de Espadas | 3 | 1 | Universal | Qualquer casa | Ganhe 1 Favor. | — |
| 4 de Espadas | 4 | 2 | Universal | Qualquer casa | Veja a mão de um adversário. | — |
| 5 de Espadas | 5 | 2 | Universal | Qualquer casa | Troque 1 carta sua por 1 aleatória de um adversário. | interferencia |
| 6 de Espadas | 6 | 2 | Universal | Qualquer casa | Olhe 3 cartas do Destino e reorganize. | — |
| 7 de Espadas | 1 | 3 | Elemental | Apolo, Atena, Hermes | Compre 2 cartas e descarte 2. | — |
| 8 de Espadas | 2 | 3 | Elemental | Apolo, Atena, Hermes | Ganhe 2 Glórias se estiver atrás do líder; caso contrário, 1. | — |
| 9 de Espadas | 3 | 3 | Elemental | Apolo, Atena, Hermes | Olhe 4 cartas do Destino e reorganize. | — |
| 10 de Espadas | 4 | 3 | Elemental | Apolo, Atena, Hermes | Ganhe 2 Glórias e 1 Favor. | — |
| Pajem de Espadas | 2 | 2 | Elemental | Apolo, Atena, Hermes | Sua próxima carta de efeito custa −1 Dracma. | — |
| Cavaleiro de Espadas | 5 | 3 | Divina: Hermes | Hermes, Ares | Teletransporte-se para qualquer casa comum. | — |
| Rainha de Espadas | 3 | 4 | Divina: Atena | Atena | Ganhe 2 Glórias; compre 2 cartas e descarte 2. | — |
| Rei de Espadas | 6 | 5 | Divina: Apolo | Apolo, Atena | Ganhe 3 Glórias e veja 3 cartas do Destino. | — |

### Ouros — Terra

| Carta | Mov. | Custo | Uso | Templos onde o efeito vale | Efeito | Sabotagem |
|---|---|---|---|---|---|---|
| Ás de Ouros | 1 | 0 | Universal | Qualquer casa | Ganhe 2 Dracmas. | — |
| 2 de Ouros | 2 | 1 | Universal | Qualquer casa | Ganhe 3 Dracmas. | — |
| 3 de Ouros | 3 | 1 | Universal | Qualquer casa | Ganhe 1 Dracma e 1 Favor. | — |
| 4 de Ouros | 4 | 2 | Universal | Qualquer casa | Ganhe 4 Dracmas. | — |
| 5 de Ouros | 5 | 2 | Universal | Qualquer casa | Ganhe 3 Dracmas e remova 1 Húbris. | — |
| 6 de Ouros | 6 | 2 | Universal | Qualquer casa | Ganhe 5 Dracmas. | — |
| 7 de Ouros | 1 | 3 | Elemental | Hera, Ártemis, Deméter | Ganhe 6 Dracmas. | — |
| 8 de Ouros | 2 | 3 | Elemental | Hera, Ártemis, Deméter, Hefesto | Ganhe 4 Dracmas e 1 Favor. | — |
| 9 de Ouros | 3 | 3 | Elemental | Hera, Ártemis, Deméter | Ganhe 2 Glórias e 3 Dracmas. | — |
| 10 de Ouros | 4 | 3 | Elemental | Hera, Ártemis, Deméter | Ganhe 7 Dracmas. | — |
| Pajem de Ouros | 2 | 2 | Elemental | Hera, Ártemis, Deméter | Ganhe 2 Dracmas; compre 1 carta e descarte 1. | — |
| Cavaleiro de Ouros | 5 | 3 | Divina: Ártemis | Ártemis, Hermes | Ganhe 2 Glórias; teletransporte-se até 2 casas adiante. | — |
| Rainha de Ouros | 3 | 4 | Divina: Deméter | Deméter, Hera | Ganhe 6 Dracmas e 2 Glórias. | — |
| Rei de Ouros | 6 | 5 | Divina: Hera | Hera, Hefesto | Ganhe 3 Glórias e 2 Favores; remova 1 Húbris. | — |

## 14. Afinidades de cartas por templo

| Templo | Cartas afins (também podem ser jogadas ali) |
|---|---|
| Zeus | Rei de Paus, Ás de Paus |
| Hera | Rainha de Copas, Rainha de Ouros |
| Apolo | Ás de Espadas, Pajem de Espadas |
| Ártemis | Cavaleiro de Paus, Pajem de Paus |
| Atena | Rei de Espadas, Rainha de Espadas |
| Ares | 5 de Paus, Cavaleiro de Espadas |
| Hefesto | Rei de Ouros, 8 de Ouros |
| Dionísio | 7 de Copas, 9 de Copas |
| Hermes | Cavaleiro de Ouros, 2 de Ouros |
| Deméter | Ás de Ouros, Rainha de Ouros |
| Afrodite | 2 de Copas, Rainha de Copas |
| Poseidon | Rei de Copas, Ás de Copas |

## 15. Arcanos Maiores (22 cartas do Destino)

| Nº | Arcano | Efeito |
|---|---|---|
| 0 | O Louco | Todos compram 1 carta e descartam 1. |
| I | O Mago | Ativo ganha 2 Dracmas e 1 Favor. |
| II | A Sacerdotisa | Ativo olha as 3 próximas cartas do Destino e reorganiza. |
| III | A Imperatriz | Todos ganham 3 Dracmas. |
| IV | O Imperador | Líder em Glória ganha 1 Húbris; demais ganham 1 Dracma. |
| V | O Hierofante | Todos removem 1 Húbris. |
| VI | Os Enamorados | Ativo escolhe outro; ambos ganham 1 Favor. |
| VII | O Carro | Ativo avança 3 casas sem ativar o destino. |
| VIII | A Justiça | Jogadores com 3+ Húbris perdem até 2 Dracmas. |
| IX | O Eremita | Ativo compra 2 cartas e descarta 2. |
| X | A Roda da Fortuna | Todos descartam as mãos e compram 6. |
| XI | A Força | Ativo ganha 2 Glórias e 1 Húbris. |
| XII | O Enforcado | Ativo perde 1 Favor; sem Favor, perde até 2 Dracmas. |
| XIII | A Morte | Todos descartam 1 carta aleatória, se tiverem. |
| XIV | A Temperança | Todos removem até 2 Húbris. |
| XV | O Diabo | Ativo ganha 5 Dracmas e 2 Húbris. |
| XVI | A Torre | Todos perdem até 3 Dracmas. |
| XVII | A Estrela | Jogador com menos Glória ganha 2 Glórias. |
| XVIII | A Lua | Todos revelam 1 carta aleatória; ativo ganha 1 Favor. |
| XIX | O Sol | Todos ganham 1 Glória. |
| XX | O Julgamento | Jogadores com 4+ Húbris vão ao Tártaro. |
| XXI | O Mundo | Ativo ganha 3 Glórias e 1 Favor. |

## 16. Armadilhas

Ação principal: descartar uma carta, pagar o custo e escolher a casa (exceto templos, Delfos, Tártaro e Nêmesis).

| Armadilha | Custo | Efeito na vítima |
|---|---|---|
| Rede de Hefesto | 2 Dracmas | Perde 2 Dracmas |
| Névoa de Hécate | 2 Dracmas | Recebe +1 Húbris |
| Emboscada de Ares | 3 Dracmas | Perde 1 Favor |
| Selo de Hermes | 2 Dracmas | Descarta uma carta aleatória e compra outra |
| Espinhos de Ártemis | 2 Dracmas | Perde 1 Dracma e recebe +1 Húbris |

## 17. Sabotagens

Cartas existentes que contam como sabotagem:

| Carta | Tipo | Efeito |
|---|---|---|
| 3 de Paus | roubo | Transfira até 1 Dracma de um adversário para você. |
| 5 de Paus | politica | Um adversário perde até 1 Favor; você ganha 1 Húbris. |
| 8 de Paus | ataque | Ganhe 2 Glórias; adversário perde até 1 Glória. |
| Cavaleiro de Paus | roubo | Roube até 3 Dracmas; ganhe 1 Húbris. |
| Cavaleiro de Copas | deslocamento | Mova um adversário até 3 casas adiante, sem ativar o destino. |
| 5 de Espadas | interferencia | Troque 1 carta sua por 1 aleatória de um adversário. |

Sabotagens diretas (desligado, aguardando aprovação do design):

| Tipo | Custo | Efeito |
|---|---|---|
| Roubo | 2 Dracmas | Transfere até 2 Dracmas do adversário |
| Maldição | 3 Dracmas | Adversário recebe +1 Húbris |
| Bloqueio | 2 Dracmas + 1 Favor | Impede o uso de relíquias por um turno do alvo |
| Interferência | 2 Dracmas | Adversário descarta uma carta aleatória e compra outra |
| Sabotagem política | 3 Dracmas | Adversário perde 1 Favor |

## 18. Investimentos

| Investimento | Templo | Custo | Renda | Duração | Total |
|---|---|---|---|---|---|
| Forja Produtiva | Hefesto | 5 Dracmas | +1 Dracma por rodada | 8 rodadas | 8 Dracmas |
| Colheita Sagrada | Deméter | 4 Dracmas | +2 Dracmas por rodada | 4 rodadas | 8 Dracmas |

## 19. Eventos globais

| Evento | Efeito |
|---|---|
| Festival de Dionísio | Apostas vencidas rendem +1 Dracma. |
| Bênção de Deméter | A primeira casa de Dracmas atravessada por turno rende +1 Dracma. |
| Ira de Ares | Vencedores de duelos recebem +1 Dracma. |
| Conselho de Atena | A primeira carta de Espadas usada como efeito por rodada custa −1 Dracma (mínimo 1). |
| Maré de Poseidon | O primeiro Tesouro de cada jogador por rodada rende +1 Dracma. |
| Julgamento de Zeus | Quem tiver 5 ou mais de Húbris paga 1 Dracma ao fim de cada rodada. |

## 20. Contratos divinos

Módulo desligado por padrão.

| Deus | Objetivo | Meta | Recompensa |
|---|---|---|---|
| Zeus | Acumular 8 Favores | 8 | +2 Glória |
| Hera | Vencer uma eleição | 1 | +2 Glória |
| Apolo | Remover 3 Húbris | 3 | +2 Glória |
| Ártemis | Parar em 3 regiões diferentes | 3 | +2 Glória |
| Atena | Vencer 2 duelos | 2 | +2 Glória |
| Ares | Vencer 1 duelo como atacante | 1 | +1 Glória, +2 Dracmas |
| Hefesto | Concluir um investimento | 1 | +2 Glória |
| Dionísio | Ganhar 6 Dracmas em apostas | 6 | +2 Glória |
| Hermes | Realizar 3 trocas comerciais | 3 | +2 Glória |
| Deméter | Receber 6 Dracmas de investimentos | 6 | +2 Glória |
| Afrodite | Obter 5 Favores | 5 | +2 Glória |
| Poseidon | Visitar 3 regiões diferentes | 3 | +2 Glória |

## 21. Oráculo de Delfos e duelos

| Regra | Valor |
|---|---|
| Votos | Favor atual (+1 com a Coroa de Hera); o Favor não é gasto |
| Desempate | Menos Húbris, depois menos Glória; persistindo, cargo vago |
| Ao ser eleito | +1 Glória |
| Visão Profética | Ver 3 cartas do Destino, grátis, 1 vez por rodada |
| Tecelagem | Reorganizar 3 cartas do Destino por 2 Favores, 1 vez por mandato |
| Proteção do Destino | Ignorar um Arcano Maior que o prejudique, por 3 Favores, 1 vez por mandato |
| Duelo: lances | Cada lado aposta de 0 a 3 Favores em segredo; ambos são gastos |
| Duelo: força | Aposta + 1 (Lança de Ares) + 2 (Preparação de Guerra) |
| Duelo: atacante vence | Toma até 2 Dracmas (ou 1 Glória no Confronto de Ares) |
| Duelo: defensor vence | Recebe até 1 Favor do atacante |
| Duelo: empate | Sem prêmio |
