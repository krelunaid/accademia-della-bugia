-- Accademia della Bugia — community board, challenges, lottery, almanac

create table if not exists profiles (
  user_id      text primary key,
  display_name text not null,
  is_editor    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists announcements (
  id           serial primary key,
  author_id    text not null,
  title        text not null,
  body         text not null,
  pinned       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists announcements_created_idx on announcements (pinned desc, created_at desc);

create table if not exists challenges (
  id           serial primary key,
  author_id    text not null,
  title        text not null,
  prompt       text not null,
  category     text not null default 'libera',
  status       text not null default 'aperta',
  deadline     timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists challenges_status_idx on challenges (status, created_at desc);

create table if not exists submissions (
  id           serial primary key,
  challenge_id integer not null references challenges(id) on delete cascade,
  user_id      text not null,
  author_name  text not null,
  title        text not null,
  body         text not null,
  is_winner    boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists submissions_challenge_idx on submissions (challenge_id, created_at desc);
create unique index if not exists submissions_one_per_user
  on submissions (challenge_id, user_id);

create table if not exists lottery_prizes (
  id           serial primary key,
  ticket_code  text not null,
  prize        text not null,
  sponsor      text,
  claimed      boolean not null default false
);
create unique index if not exists lottery_ticket_idx on lottery_prizes (ticket_code);

create table if not exists almanac_entries (
  id           serial primary key,
  year         integer not null,
  section      text not null,
  winner_name  text not null,
  title        text not null,
  body         text not null,
  sort_order   integer not null default 0
);

-- Seed: announcements (from the Accademia's public life)
insert into announcements (author_id, title, body, pinned, created_at) values
(
  'seed',
  'Lotteria della Bugia: i premi da ritirare',
  E'Purtroppo in molti ci avete segnalato problemi tecnici che non permettono di visitare il nostro sito da smartphone. Pubblichiamo qui i numeri vincenti.\n\nI vincitori possono scrivere a accademiabugia@gmail.com per ritirare il premio. Tra i premi veri: buoni cena, spesa, gelato, taglieri, magliette, calamite. Tra quelli un po'' meno veri: un appartamento in Alaska con vicini simpatici, una crociera sul Colorado River e un picnic sul Monte Everest.\n\nCercate il vostro numero nella pagina Lotteria.',
  true,
  '2026-08-19 08:00:00+02'
),
(
  'seed',
  '50° Campionato Italiano della Bugia — 1 e 2 agosto 2026',
  E'Dal 1966 a oggi: sessant''anni di bugie dette sul serio. Sabato 1 e domenica 2 agosto 2026, Piazza della Chiesa, Le Piastre (Pistoia).\n\nSezione grafica e letteraria in premiazione sabato. Sezione verbale — il Campionato — domenica alle 16.36 in punto (circa). Cene bugiarde, Antebugia, The Bugia Show, Dottor Swing.\n\nIngresso agli spettacoli gratuito. Prenotazioni cena: 0573 472201.',
  true,
  '2026-07-10 10:00:00+02'
),
(
  'seed',
  'Sezione letteraria: il racconto vincitore',
  E'Si chiama Alessandra Biagini e ha vinto il Bugiardino d''oro nell''ultima edizione del Campionato italiano della Bugia, sezione letteraria. Il racconto è ora nell''Almanacco, dove restano le bugie che hanno fatto la storia — e quelle che la storia ha fatto finta di non sentire.',
  false,
  '2026-08-05 18:30:00+02'
),
(
  'seed',
  'Apertura straordinaria della Ghiacciaia della Madonnina',
  E'Domenica 2 agosto, dalle 10 alle 13, visita guidata al sistema di produzione e conservazione del ghiaccio naturale. Ingresso a offerta libera, senza prenotazione. Il ghiaccio, a differenza delle bugie, non si scioglie se lo racconti bene.',
  false,
  '2026-07-28 09:00:00+02'
);

-- Seed: challenges the Redattore can close / judge; visitors can still enter open ones
insert into challenges (author_id, title, prompt, category, status, deadline, created_at) values
(
  'seed',
  'La bugia più bella d''estate',
  E'Racconta, in non più di 400 parole, un fatto accaduto quest''estate a Le Piastre o nei dintorni. Deve essere falso. Deve sembrare vero. Vince chi fa dire al lettore: «Aspetta, però…».',
  'letteraria',
  'aperta',
  '2026-09-15 23:59:00+02',
  '2026-08-03 12:00:00+02'
),
(
  'seed',
  'Se fossi sindaco di Le Piastre per un giorno',
  E'Una delibera, un manifesto, un decreto. Cosa faresti al paese se per ventiquattr''ore nessuno ti potesse smentire? Sezione libera: verbale, scritta o disegnata a parole.',
  'libera',
  'aperta',
  '2026-10-01 23:59:00+02',
  '2026-08-08 16:00:00+02'
),
(
  'seed',
  'Un pezzo che non esiste (ancora) al Museo della Bugia',
  E'Inventa un reperto per il Museo della Bugia: titolo, provenienza, datazione e una didascalia da targa. Il reperto deve essere impossibile e documentato con cura da archivista disonesto.',
  'letteraria',
  'aperta',
  '2026-09-30 23:59:00+02',
  '2026-08-12 11:00:00+02'
),
(
  'seed',
  'La prima bugia di stagione',
  E'Sfida di apertura: in tre frasi, una bugia sul meteo della Montagna Pistoiese. Già giudicata — resta come esempio per i nuovi iscritti.',
  'verbale',
  'giudicata',
  '2026-07-20 23:59:00+02',
  '2026-07-01 10:00:00+02'
);

insert into submissions (challenge_id, user_id, author_name, title, body, is_winner, created_at)
select id, 'seed-nora', 'Nora Bartolini', 'Nevicata di luglio',
  E'Il 18 luglio, alle 14.12, ha nevicato sulla piazza della Chiesa. Non fiocchi: schede del lotto non estratte, che il vento ha preso per vere. I bambini le hanno raccolte. Alle 14.13 era di nuovo agosto e nessuno aveva vinto, tranne chi c''era.',
  true, '2026-07-18 19:00:00+02'
from challenges where title = 'La prima bugia di stagione';

insert into submissions (challenge_id, user_id, author_name, title, body, is_winner, created_at)
select id, 'seed-elio', 'Elio Gori', 'Il sindaco ha vietato le ombre',
  E'Per contenere il caldo, il Comune ha deliberato l''abolizione delle ombre dopo le 13. Chi ne proietta una è soggetto a multa. I pini di viale sono stati ammoniti. Io ho pagato in anticipo.',
  false, '2026-07-19 08:12:00+02'
from challenges where title = 'La prima bugia di stagione';

insert into submissions (challenge_id, user_id, author_name, title, body, is_winner, created_at)
select id, 'seed-clara', 'Clara Vannucci', 'Il cinghiale assessore',
  E'Da giugno un cinghiale siede in giunta con delega al silenzio. Non parla, ma vota alzando il grugno. La maggioranza è stretta. I verbali odorano di bosco.',
  false, '2026-08-10 21:40:00+02'
from challenges where title = 'Se fossi sindaco di Le Piastre per un giorno';

-- Lottery prizes (from the Accademia Facebook notice, August 2026)
insert into lottery_prizes (ticket_code, prize, sponsor, claimed) values
('963',  'Buono cena', 'Toscana Fair', false),
('241',  'Buono spesa 50 euro', 'Macelleria Biondi di Prunetta', false),
('936',  'Buono gelato da un kg', 'Pasticceria Begliomini', false),
('216',  'Tagliere del Campionato italiano della Bugia', null, false),
('090',  'Tagliere del Campionato italiano della Bugia', null, false),
('979',  'Tagliere del Campionato italiano della Bugia', null, false),
('178',  'Tagliere del Campionato italiano della Bugia', null, false),
('428',  'Tagliere del Campionato italiano della Bugia', null, false),
('027',  'Tagliere del Campionato italiano della Bugia', null, false),
('989',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('258',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('227',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('259',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('948',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('052',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('423',  'T-shirt a scelta (d''annata o moderna)', 'Campionato italiano della Bugia', false),
('310',  'Calamita Le Piastre', null, false),
('098',  'Calamita Le Piastre', null, false),
('218',  'Calamita Le Piastre', null, false),
('264',  'Calamita Le Piastre', null, false),
('795',  'Calamita Le Piastre', null, false),
('155',  'Calamita Le Piastre', null, false),
('186',  'Calamita Le Piastre', null, false),
('077',  'Calamita Le Piastre', null, false),
('096',  'Calamita Le Piastre', null, false),
('922',  'Calamita Le Piastre', null, false),
('643',  'Calamita Le Piastre', null, false),
('35',   'Portachiavi', null, false),
('990',  'Portachiavi', null, false),
('935',  'Portachiavi', null, false),
('127',  'Portachiavi', null, false),
('1120', 'Appartamento in Alaska comprensivo di mobili e simpatici vicini', 'Sezione premi immaginari', false),
('2334', 'Crociera sul Colorado River', 'Sezione premi immaginari', false),
('5652', 'Picnic sul Monte Everest', 'Sezione premi immaginari', false);

insert into almanac_entries (year, section, winner_name, title, body, sort_order) values
(
  1966, 'verbale', 'Giancarlo Pozzini', 'La prima bugia',
  E'Nel millenovecentosessantasei si tenne il primo campionato, e fu Giancarlo Pozzini a vincerlo con una bugia fantastica. Da allora Le Piastre è il paese dove la verità ha il diritto di riposare, una volta all''anno, in piazza.',
  10
),
(
  2025, 'letteraria', 'Alessandra Biagini', 'Bugiardino d''oro',
  E'Alessandra Biagini ha vinto il Bugiardino d''oro nella sezione letteraria. Il racconto resta negli archivi dell''Accademia e, a detta di chi l''ha letto due volte, è più vero la seconda.',
  20
),
(
  2024, 'verbale', 'Vincenzo «il Tardo» Neri', 'Il treno che fermò per ascoltare',
  E'Alle 19.11 il regionale per Pistoia si fermò fuori stazione perché il macchinista aveva sentito una bugia così ben detta che voleva il finale. I passeggeri scesero. Qualcuno applaudì. Il treno ripartì in ritardo di una verità.',
  30
),
(
  2019, 'grafica', 'Collettivo Sottobosco', 'Mappa del paese che non c''è',
  E'Una mappa di Le Piastre in cui ogni vicolo porta a un altro paese, e tutti i paesi si chiamano Le Piastre. Esposta al Museo della Bugia, se il Museo esistesse nel punto in cui la mappa lo colloca.',
  40
),
(
  2008, 'verbale', 'Maria Grazia Lotti', 'Mia nonna ha inventato il ghiaccio',
  E'Prima di lei, in montagna, l''acqua restava acqua anche d''inverno. La nonna soffiò nei pozzi. Nacque la Ghiacciaia della Madonnina. I francesi lo chiamano brevetto; a Le Piastre lo chiamiamo martedì.',
  50
);
