// Shared by the server and the browser app.
// CEFR sub-bands and action-oriented "Can-Do" statements, adapted (not quoted) from the
// Council of Europe CEFR Companion Volume (2020) descriptor scales.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const SKILLS = ['reading', 'writing', 'listening', 'speaking'];
export const BANDS = LEVELS.flatMap((l) => [`${l}.1`, `${l}.2`]);
export const bandLevel = (band) => String(band).slice(0, 2);
export const nextBand = (band) => BANDS[Math.min(BANDS.length - 1, BANDS.indexOf(band) + 1)];
export const firstBand = (level) => `${level}.1`;

/** Communicative functions. Moving up one sub-band needs one passed task of each, in that skill. */
export const FUNCTIONS = ['transactional', 'interactional', 'evaluative'];
export const FUNCTION_INFO = {
  transactional: { label: 'Transactional', short: 'T', about: 'Getting things done: information, services, arrangements.' },
  interactional: { label: 'Interactional', short: 'I', about: 'Building relationships: introductions, news, personal stories.' },
  evaluative: { label: 'Evaluative', short: 'E', about: 'Giving and understanding opinions, feelings and comparisons.' },
};

export const canDoId = (skill, level, fn) => `${skill}.${level}.${fn}`;

export const CAN_DO = {
  reading: {
    A1: {
      transactional: 'Can find simple facts such as prices, times and places in short notices and menus.',
      interactional: 'Can understand short, simple personal texts such as an introduction or a postcard.',
      evaluative: 'Can tell from a short, simple text whether someone likes something or how they feel.',
    },
    A2: {
      transactional: 'Can find the information needed to act on everyday messages, rules and invitations.',
      interactional: 'Can follow short personal stories and messages about routines and past events.',
      evaluative: 'Can understand simple comparisons and opinions in short texts about familiar topics.',
    },
    B1: {
      transactional: 'Can find and use relevant details in longer everyday texts such as letters and articles.',
      interactional: 'Can understand descriptions of events, feelings and wishes in personal writing.',
      evaluative: "Can identify a writer's main conclusions and attitude in clearly argued texts.",
    },
    B2: {
      transactional: 'Can quickly scan long, complex texts and pick out the details needed for a task.',
      interactional: 'Can follow personal and professional correspondence and grasp implied meaning.',
      evaluative: 'Can understand articles in which writers take particular stances, including implicit attitudes.',
    },
    C1: {
      transactional: 'Can understand detailed instructions and specialised texts outside their field, re-reading difficult parts.',
      interactional: 'Can understand any correspondence, recognising subtle shifts in tone and relationship.',
      evaluative: 'Can understand long, demanding texts and appreciate distinctions of style and implicit meaning.',
    },
    C2: {
      transactional: 'Can understand virtually any form of written language, including abstract or highly technical texts.',
      interactional: 'Can appreciate social, cultural and stylistic nuance in any personal or literary writing.',
      evaluative: 'Can critically appraise complex arguments, irony and rhetorical effect in sophisticated texts.',
    },
  },
  writing: {
    A1: {
      transactional: 'Can write a short note or fill in a form with personal details, times and requests.',
      interactional: 'Can write simple phrases and sentences about themselves and the people around them.',
      evaluative: 'Can say in simple sentences what they like or dislike and give a very simple reason.',
    },
    A2: {
      transactional: 'Can write short, simple notes and messages relating to everyday needs, such as requests or returns.',
      interactional: 'Can write a simple personal message describing past events, plans and routines.',
      evaluative: 'Can write simple comparisons and say why they prefer one thing to another.',
    },
    B1: {
      transactional: 'Can write emails and letters that ask for or pass on information and get things done.',
      interactional: 'Can write personal letters describing experiences, feelings and events in some detail.',
      evaluative: 'Can write a short review or opinion text giving reasons for and against.',
    },
    B2: {
      transactional: 'Can write clear, detailed formal emails that make proposals, complain or request action.',
      interactional: 'Can write letters conveying degrees of emotion and highlighting the personal significance of events.',
      evaluative: 'Can write an essay that develops an argument, giving reasons for and against a point of view.',
    },
    C1: {
      transactional: 'Can write well-structured formal texts adapted to the reader, purpose and register.',
      interactional: 'Can express themselves with flexibility in personal correspondence, including emotional and allusive language.',
      evaluative: 'Can write clear, well-structured expositions of complex subjects, underlining the salient issues.',
    },
    C2: {
      transactional: 'Can write complex reports and documents in an appropriate, effective style.',
      interactional: 'Can write with complete appropriacy for any social context, including humour and nuance.',
      evaluative: 'Can write sophisticated critical appraisals with a logical structure that helps the reader.',
    },
  },
  listening: {
    A1: {
      transactional: 'Can understand numbers, prices and times in slow, clear exchanges such as ordering or checking in.',
      interactional: 'Can follow a slow, simple conversation about names, places and families.',
      evaluative: 'Can understand when a speaker says, slowly and clearly, that they like or dislike something.',
    },
    A2: {
      transactional: 'Can understand simple directions, arrangements and information about everyday plans.',
      interactional: 'Can follow short, clear conversations about weekends, holidays and daily life.',
      evaluative: 'Can understand simple opinions, preferences and comparisons in clear, slow speech.',
    },
    B1: {
      transactional: 'Can understand practical information such as appointments, tickets and services in clear speech.',
      interactional: 'Can follow the main points of extended everyday conversation in standard speech.',
      evaluative: 'Can follow an argument or point of view in clear speech on familiar topics.',
    },
    B2: {
      transactional: 'Can understand detailed instructions and negotiations at normal speed.',
      interactional: 'Can keep up with animated conversation between fluent speakers.',
      evaluative: "Can follow complex lines of argument and identify the speaker's viewpoint and attitude.",
    },
    C1: {
      transactional: 'Can understand complex technical information and specifications delivered at natural speed.',
      interactional: 'Can follow extended discourse even when relationships are only implied.',
      evaluative: 'Can recognise a wide range of idiomatic expressions and shifts in register, appreciating attitude.',
    },
    C2: {
      transactional: 'Can understand any kind of spoken language, including fast native speech, without difficulty.',
      interactional: 'Can follow nuanced social interaction including humour, irony and cultural references.',
      evaluative: 'Can critically evaluate subtle, implicit argumentation in any spoken genre.',
    },
  },
  speaking: {
    A1: {
      transactional: 'Can ask for and give simple things such as food, tickets and directions, using numbers and times.',
      interactional: 'Can ask and answer simple questions about themselves, family and where they live.',
      evaluative: 'Can say simply what they like or dislike, with a very simple reason.',
    },
    A2: {
      transactional: 'Can handle short routine exchanges such as booking, changing plans or giving directions.',
      interactional: 'Can describe routine daily activities, past events and plans in simple terms.',
      evaluative: 'Can make simple comparisons and say what they prefer and why.',
    },
    B1: {
      transactional: 'Can deal with most situations likely to arise when travelling or arranging services.',
      interactional: 'Can narrate experiences and describe feelings, reactions and challenges with some detail.',
      evaluative: 'Can give brief reasons and explanations for opinions, plans and advice.',
    },
    B2: {
      transactional: 'Can negotiate solutions, outlining issues and consequences clearly.',
      interactional: 'Can interact with a degree of fluency that makes regular interaction with fluent speakers possible.',
      evaluative: 'Can develop an argument systematically, giving the advantages and disadvantages of options.',
    },
    C1: {
      transactional: 'Can handle complex transactions and negotiations with precision, adapting register to the listener.',
      interactional: 'Can use language flexibly and effectively for social purposes, including emotional and allusive use.',
      evaluative: 'Can present complex arguments fluently, integrating sub-themes and rounding off with a conclusion.',
    },
    C2: {
      transactional: 'Can manage any transaction with full control, reformulating smoothly to overcome difficulty.',
      interactional: 'Can convey finer shades of meaning precisely, with full sociolinguistic and idiomatic competence.',
      evaluative: 'Can argue a formal position convincingly, responding to questions and counter-arguments with ease.',
    },
  },
};

export const canDoStatement = (skill, level, fn) => CAN_DO[skill]?.[level]?.[fn] ?? '';

/** Action-oriented goal of each sub-band (CLAUDE.md section 3). The learner is judged on these, not on abstract rules. */
export const BAND_GOALS = {
  'A1.1': 'Can introduce themselves and express basic needs.',
  'A1.2': 'Can describe daily routines and their immediate surroundings in simple terms.',
  'A2.1': 'Can talk about past events and handle simple everyday transactions.',
  'A2.2': 'Can describe plans, make basic comparisons and give simple directions.',
  'B1.1': 'Can give and explain opinions on familiar topics.',
  'B1.2': 'Can handle hypothetical situations and write everyday professional emails.',
  'B2.1': 'Can build a clear argument and weigh pros and cons.',
  'B2.2': 'Can speculate about the past and switch confidently between formal and informal register.',
  'C1.1': 'Can express ideas fluently with emphasis, nuance and well-chosen idioms.',
  'C1.2': 'Can argue abstract and complex topics with precise discourse control.',
  'C2.1': 'Can resolve ambiguity and use irony and style deliberately.',
  'C2.2': 'Can communicate with native-like rhetoric and sociolinguistic tact in any setting.',
};
