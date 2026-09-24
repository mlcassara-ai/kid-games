/* Math Quest — weekly school content.
   This file is the only thing that needs to change each week:
   spelling words, homework math problems, and topic quizzes, per kid.
   Kids are matched by their hero name (lower case). Anyone else gets the grade list. */

const GRADE3_WORDS = [
  { w: 'because', s: 'I wore my coat because it was cold outside.' },
  { w: 'friend', s: 'My friend and I built a fort.' },
  { w: 'again', s: 'Can we play that game again?' },
  { w: 'laugh', s: 'The funny puppy made me laugh.' },
  { w: 'answer', s: 'Raise your hand to answer the question.' },
  { w: 'believe', s: 'I believe you can do it.' },
  { w: 'different', s: 'Every snowflake is different.' },
  { w: 'enough', s: 'Do we have enough cookies for everyone?' },
  { w: 'favorite', s: 'Blue is my favorite color.' },
  { w: 'beautiful', s: 'The sunset was beautiful tonight.' },
  { w: 'caught', s: 'She caught the ball with one hand.' },
  { w: 'heard', s: 'I heard an owl hooting last night.' },
  { w: 'library', s: 'We borrowed three books from the library.' },
  { w: 'minute', s: 'Please wait one minute.' },
  { w: 'often', s: 'We often walk the dog after dinner.' },
  { w: 'people', s: 'Lots of people came to the fair.' },
  { w: 'busy', s: 'The bees are busy making honey.' },
  { w: 'early', s: 'We woke up early for the trip.' },
  { w: 'through', s: 'The train went through the tunnel.' },
  { w: 'surprise', s: 'We planned a surprise party for Mom.' }
];

const GRADE5_WORDS = [
  { w: 'necessary', s: 'Is it necessary to bring a jacket?' },
  { w: 'separate', s: 'Please separate the paper from the plastic.' },
  { w: 'environment', s: 'We should protect the environment.' },
  { w: 'government', s: 'The government builds roads and schools.' },
  { w: 'restaurant', s: 'We ate tacos at a new restaurant.' },
  { w: 'rhythm', s: 'Clap your hands to the rhythm of the song.' },
  { w: 'receive', s: 'Did you receive my letter?' },
  { w: 'immediately', s: 'Come inside immediately, it is starting to rain.' },
  { w: 'temperature', s: 'The temperature dropped below freezing.' },
  { w: 'calendar', s: 'Mark the game on the calendar.' },
  { w: 'opportunity', s: 'This is a great opportunity to learn.' },
  { w: 'similar', s: 'Your drawing is similar to mine.' },
  { w: 'recommend', s: 'I recommend the chocolate ice cream.' },
  { w: 'guarantee', s: 'I can not guarantee it will be sunny.' },
  { w: 'exaggerate', s: 'Do not exaggerate how big the fish was.' },
  { w: 'conscience', s: 'Her conscience told her to tell the truth.' },
  { w: 'particular', s: 'He likes one particular kind of cereal.' },
  { w: 'vacuum', s: 'Please vacuum the living room rug.' },
  { w: 'parallel', s: 'The two lines are parallel.' },
  { w: 'February', s: 'February is the shortest month.' }
];

window.MQ_CONTENT = {
  updated: '2026-09-24',

  kids: {
    mika: {
      spelling: { title: 'Starter 3rd grade words', words: GRADE3_WORDS },
      // homework: [{ id: 'hw-2026-09-28', title: 'Homework: Sep 28', problems: [{ q: '47 + 38', a: '85' }] }],
      homework: [],
      quizzes: ['ca-missions']
    },
    jibreel: {
      spelling: { title: 'Starter 5th grade words', words: GRADE5_WORDS },
      homework: [],
      quizzes: ['ca-missions']
    }
  },

  // Players who aren't named above get a list by grade.
  byGrade: {
    '3': { spelling: { title: 'Starter 3rd grade words', words: GRADE3_WORDS }, homework: [], quizzes: ['ca-missions'] },
    '5': { spelling: { title: 'Starter 5th grade words', words: GRADE5_WORDS }, homework: [], quizzes: ['ca-missions'] }
  },

  quizzes: {
    'ca-missions': {
      title: 'California Missions',
      emoji: '⛪',
      note: 'Sample quiz',
      questions: [
        { q: 'What was the first of the California missions, started in 1769?', c: ['Mission San Diego de Alcalá', 'Mission Santa Barbara', 'Mission San Luis Rey', 'Mission Carmel'], a: 0,
          why: 'Mission San Diego de Alcalá was the first California mission, started in 1769.' },
        { q: 'Which Spanish priest started Mission San Diego de Alcalá?', c: ['Juan Cabrillo', 'Father Junípero Serra', 'Hernán Cortés', 'Christopher Columbus'], a: 1,
          why: 'Father Junípero Serra started Mission San Diego and eight more California missions.' },
        { q: 'Which country sent the priests and soldiers who built the missions?', c: ['England', 'France', 'Spain', 'Russia'], a: 2,
          why: 'Spain sent them to claim California and spread its religion.' },
        { q: 'How many missions were built in California?', c: ['7', '13', '21', '50'], a: 2,
          why: 'There were 21 California missions, from San Diego up to Sonoma.' },
        { q: 'What was the road that connected the missions called?', c: ['Route 66', 'El Camino Real', 'The Oregon Trail', 'Main Street'], a: 1,
          why: 'El Camino Real means "The Royal Road." It linked the missions.' },
        { q: 'The missions were mostly built with sun-dried bricks made of mud and straw. What are they called?', c: ['Marble', 'Adobe', 'Glass', 'Steel'], a: 1,
          why: 'Adobe bricks are made of mud and straw dried in the sun.' },
        { q: 'Which Native American people were living in the San Diego area when the mission was built?', c: ['Kumeyaay', 'Navajo', 'Cherokee', 'Iroquois'], a: 0,
          why: 'The Kumeyaay people have lived in the San Diego area for thousands of years.' },
        { q: 'Why did Mission San Diego move in 1774 to its spot in Mission Valley?', c: ['To be near the ocean', 'To be closer to water and good farmland', 'To hide from pirates', 'To be on top of a mountain'], a: 1,
          why: 'The new spot by the San Diego River had more water and better land for farming.' },
        { q: 'In 1775, some Kumeyaay people burned Mission San Diego. What were they fighting against?', c: ['A flood', 'A new school rule', 'The Spanish taking their land and changing their way of life', 'A lost sports game'], a: 2,
          why: 'Many Kumeyaay people resisted the Spanish taking their land and forcing big changes on their lives.' },
        { q: 'Mission San Luis Rey, called the "King of the Missions," is in which San Diego County city?', c: ['Ramona', 'Oceanside', 'Chula Vista', 'Escondido'], a: 1,
          why: 'Mission San Luis Rey de Francia is in Oceanside.' }
      ]
    }
  }
};
