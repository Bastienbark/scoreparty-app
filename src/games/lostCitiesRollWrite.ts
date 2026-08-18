import type { LostCitiesRwHistoryEntry, LostCitiesRwLiveGame } from '../types/models';
import type { GameDef } from './types';

export const lostCitiesRwGame: GameDef<LostCitiesRwLiveGame, LostCitiesRwHistoryEntry> = {
  id: 'lost-cities-rw',
  name: 'Lost Cities: Roll & Write',
  badge: '🗺️',
  color: '#FF7A1A',
  tagline: 'Roll & write · 2 à 5 joueurs · le score le plus élevé gagne',
  totalRounds: 1,
  hasVariants: false,
  variantDefs: [],
  minPlayers: 2,
  maxPlayers: 5,
  rulesContent: [
    {
      id: 'tour',
      title: 'Déroulement du tour',
      items: [
        {
          q: 'Comment se joue un tour ?',
          a: "Le joueur actif lance les 6 dés (3 dés colorés + 3 dés numérotés de 0 à 9), puis choisit 1 dé chiffre ET 1 dé couleur à inscrire sur sa fiche, sans modifier les résultats. Les 4 dés restants sont disponibles pour tous les autres joueurs, qui choisissent chacun leur tour (ou simultanément) une combinaison chiffre/couleur parmi ceux-ci — plusieurs joueurs peuvent choisir la même combinaison.",
        },
        {
          q: 'Peut-on refuser les dés ?',
          a: "Oui, à tout moment un joueur peut refuser les résultats et ne rien inscrire : il doit alors hachurer 1 symbole Dés sur sa fiche (de bas en haut).",
        },
      ],
    },
    {
      id: 'expeditions',
      title: 'Mener les expéditions',
      items: [
        {
          q: 'Comment remplir une colonne d\'expédition ?',
          a: "Chaque expédition se complète du bas vers le haut avec des chiffres croissants ou égaux (1 minimum pour commencer). Une fois l'expédition commencée, un dé chiffré « 0 » compte comme un « 10 ».",
        },
        {
          q: 'Cases spéciales ?',
          a: "Case compte double (à cocher en tout premier avec un dé « 0 » de la couleur voulue, avant tout autre chiffre) : double les points de l'expédition en fin de partie. Case d'accélération : inscrire un chiffre ici permet d'en écrire immédiatement un second identique juste au-dessus. Case artefact : inscrire un chiffre ici permet aussi de hachurer un artefact à droite de la fiche.",
        },
        {
          q: 'Ponts bonus ?',
          a: "Chaque colonne (expéditions, artefacts, symboles Dés) a un pont entre sa 6ᵉ et sa 7ᵉ case. Le premier joueur à atteindre la 7ᵉ case d'une colonne remporte 20 points bonus pour ce pont (les autres le rayent).",
        },
      ],
    },
    {
      id: 'fin',
      title: 'Fin de partie et score',
      items: [
        {
          q: 'Quand la partie se termine-t-elle ?',
          a: "Dès que tous les joueurs sont « épuisés » (9 symboles Dés hachurés) ou que les 8 ponts bonus ont tous été traversés.",
        },
        {
          q: 'Comment le score est-il suivi dans l\'app ?',
          a: "ScoreParty ne connaît pas le détail des barèmes de points de Lost Cities Roll & Write — l'app te sert seulement à enregistrer le score final de chaque joueur, calculé par vous-mêmes sur votre fiche selon les règles officielles. Le score le plus élevé gagne.",
        },
      ],
    },
  ],

  createLiveGame(playerIds) {
    return { gameId: 'lost-cities-rw', playerIds, scores: {} };
  },

  isRoundComplete(live) {
    return live.playerIds.every((pid) => live.scores[pid] !== undefined);
  },
  isLastRound() {
    return true;
  },

  liveRanking(live) {
    return [...live.playerIds]
      .sort((a, b) => (live.scores[b] ?? 0) - (live.scores[a] ?? 0))
      .map((id) => ({ id, total: live.scores[id] ?? 0 }));
  },

  buildHistoryEntry(live, id, date) {
    const totals: Record<string, number> = {};
    live.playerIds.forEach((pid) => (totals[pid] = live.scores[pid] ?? 0));
    const ranking = [...live.playerIds].sort((a, b) => totals[b] - totals[a]);
    return { id, gameId: 'lost-cities-rw', date, playerIds: live.playerIds, totals, ranking };
  },

  rankingIds(entry) {
    return entry.ranking;
  },
  scoreValue(entry, playerId) {
    return entry.totals[playerId] ?? 0;
  },
  scoreLabel(entry, playerId) {
    return `${entry.totals[playerId] ?? 0} pts`;
  },
  detailLines(entry, players) {
    return entry.ranking.map((id, idx) => `${idx + 1}. ${players[id]?.name ?? '?'} — ${entry.totals[id]} pts`);
  },
  activeVariantsLabel() {
    return null;
  },
  resultLabel(entry, winnerName) {
    return `${winnerName} (${entry.totals[entry.ranking[0]]} pts)`;
  },
};
