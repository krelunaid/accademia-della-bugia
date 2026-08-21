export type ProgramItem = {
  when: string;
  title: string;
  detail: string;
};

export const CAMPIONATO = {
  edition: 50,
  years: "1966–2026",
  place: "Le Piastre, Pistoia",
  piazza: "Piazza della Chiesa",
  dinnerPhone: "0573 472201",
  dinnerMobile: "348 3369552",
  email: "accademiabugia@gmail.com",
  facebook: "https://www.facebook.com/accademia.dellabugia/",
  instagram: "https://www.instagram.com/accademiabugia/",
  site: "https://www.labugia.it/",
};

export const PROGRAMMA_2026: ProgramItem[] = [
  {
    when: "29 luglio – 30 agosto",
    title: "Mostre",
    detail:
      "Sezione grafica in gara, Ago manie di Agostino Longo, Il mio Pinocchio di Marcello Toninelli.",
  },
  {
    when: "Venerdì 31 luglio · 17.48",
    title: "Antebugia",
    detail:
      "Burattini in piazza: Il Principe Maiunagioia e una fata a pile, Compagnia Semi Volanti.",
  },
  {
    when: "Sabato 1 agosto · 19.34",
    title: "Cena bugiarda e The Bugia Show",
    detail:
      "Premiazione delle sezioni grafica e letteraria. Ospiti: Fabio Stassi, Marcello Toninelli, Marisa Schiano. Prenotazione cena obbligatoria.",
  },
  {
    when: "Domenica 2 agosto · 10–13",
    title: "Ghiacciaia della Madonnina",
    detail: "Apertura straordinaria e visita guidata. Ingresso a offerta libera.",
  },
  {
    when: "Domenica 2 agosto · 16.36",
    title: "50° Campionato — sezione verbale",
    detail:
      "Con Leonardo Manera e Alessandro Milan, laureati bugiardi ad honorem. Poi cena e spettacolo con Dottor Swing. Spettacoli a ingresso gratuito.",
  },
];
