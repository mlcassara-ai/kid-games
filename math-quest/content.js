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


// Jibreel: words from his Week 2 & Week 4 schoolwork (plurals he missed, unit vocabulary, spelling-check words)
const JIBREEL_WORDS = [
  { w: 'boxes', s: 'The store shipped the action figures in fourteen boxes.' },
  { w: 'brushes', s: 'Please wash the paint brushes after art.' },
  { w: 'dresses', s: 'The store had racks of colorful dresses.' },
  { w: 'babies', s: 'The babies were sleeping in the nursery.' },
  { w: 'benches', s: 'We sat on the benches at the park.' },
  { w: 'foxes', s: 'Two foxes ran across the field.' },
  { w: 'paragraphs', s: 'Write two paragraphs about your weekend.' },
  { w: 'loaves', s: 'The bakery made fifteen loaves of bread.' },
  { w: 'dollars', s: 'The lunchbox costs ten dollars.' },
  { w: 'pies', s: 'The bakeshop baked twenty-six blueberry pies.' },
  { w: 'equivalent', s: 'Four tenths is equivalent to forty hundredths.' },
  { w: 'fraction', s: 'Three fourths is a fraction.' },
  { w: 'volume', s: 'The volume of the box is eighty-four cubic units.' },
  { w: 'perimeter', s: 'Add all four sides to find the perimeter.' },
  { w: 'measure', s: 'Use a protractor to measure the angle.' },
  { w: 'acute', s: 'An acute angle is smaller than a right angle.' },
  { w: 'obtuse', s: 'An obtuse angle is bigger than a right angle.' },
  { w: 'multiplied', s: 'I multiplied four by six and got twenty-four.' },
  { w: 'honest', s: 'It is important to be honest.' },
  { w: 'view', s: 'The view from the mountain was amazing.' },
  { w: 'observe', s: 'Scientists observe animals in nature.' },
  { w: 'believable', s: 'His story was not very believable.' },
  { w: 'unidentified', s: 'An unidentified bird landed on the fence.' },
  { w: 'disconnected', s: 'The video call got disconnected.' }
];

window.MQ_CONTENT = {
  updated: '2026-09-25',

  kids: {
    mika: {
      spelling: { title: 'Starter 3rd grade words', words: GRADE3_WORDS },
      // homework: [{ id: 'hw-2026-09-28', title: 'Homework: Sep 28', problems: [{ q: '47 + 38', a: '85' }] }],
      homework: [],
      quizzes: ['ca-missions']
    },
    jibreel: {
      spelling: { title: "Jibreel's words from school (Week 2 & 4)", words: JIBREEL_WORDS },
      homework: [
        { id: 'j-wk4-review', title: 'Week 2 & 4 Review', problems: [
          { q: '112 people are coming to a party. Each table seats 7. How many tables?', a: '16' },
          { q: '136 flowers, 8 flowers in each vase. How many vases?', a: '17' },
          { q: 'Aiden read 182 minutes in 7 days, the same each night. Minutes per night?', a: '26', hint: 'Check your answer: 25 × 7 = 175, not 182. Try one more.' },
          { q: 'A backpack costs $49. A lunchbox costs $7. How many TIMES as much is the backpack?', a: '7', hint: 'The answer is a number of times, not dollars. 49 ÷ 7.' },
          { q: '86 cups of pecans. 2 cups make one pie. How many pies?', a: '43' },
          { q: '4/10 + ?/100 = 78/100. What is the missing fraction?', a: '38/100', hint: '4/10 is the same as 40/100.' },
          { q: '7/10 + ?/100 = 94/100. What is the missing fraction?', a: '24/100', hint: '7/10 is the same as 70/100.' },
          { q: 'A room is 9 feet wide. It is 4 times as long as it is wide. Perimeter in feet?', a: '90', hint: 'Length = 9 × 4 = 36. Then add ALL 4 sides.' },
          { q: 'A pool is 10 feet wide. It is 3 times as long as it is wide. Perimeter in feet?', a: '80', hint: 'Length = 30. Add all 4 sides.' },
          { q: 'A building is 14 feet wide. It is 6 times as long as it is wide. Perimeter in feet?', a: '196' },
          { q: 'A rectangle has a perimeter of 50 feet. The length is 18 feet. Width?', a: '7', hint: '50 − 18 − 18 = 14 for both widths.' },
          { q: 'A rectangle has an area of 56 sq. ft. The length is 14 feet. Width?', a: '4', hint: '14 × ? = 56' },
          { q: 'What is the value of the 6 in 657,224?', a: '600000' },
          { q: '16 tens + 3 hundreds = ?', a: '460' },
          { q: 'Heather can do 8 pushups. Her brother can do 6 times as many. How many can he do?', a: '48' },
          { q: 'A cube-shaped box is 7 inches deep. What is its volume in cubic inches?', a: '343', hint: 'A cube is 7 × 7 × 7.' },
          { q: '8 × 3 × 10 = ?', a: '240' },
          { q: 'A box is 4 units long, 2 units wide and 15 units tall. Volume?', a: '120' }
        ] }
      ],
      quizzes: ['j-grammar', 'j-volume', 'ca-missions']
    }
  },

  // Players who aren't named above get a list by grade.
  byGrade: {
    '3': { spelling: { title: 'Starter 3rd grade words', words: GRADE3_WORDS }, homework: [], quizzes: ['ca-missions'] },
    '5': { spelling: { title: 'Starter 5th grade words', words: GRADE5_WORDS }, homework: [], quizzes: ['ca-missions'] }
  },

  quizzes: {
    'j-grammar': {
      title: 'Grammar Power-Up',
      emoji: '✏️',
      note: "From Jibreel's Week 2 & 4 worksheets",
      questions: [
        { q: 'What is the plural of "baby"?', c: ['babys', 'babies', 'babyes', 'babbies'], a: 1, why: 'When a word ends in a consonant + y, change the y to i and add -es: babies.' },
        { q: 'What is the plural of "loaf"?', c: ['loafs', 'loaves', 'loafes', 'loavs'], a: 1, why: 'Many words ending in -f change the f to v and add -es: loaf → loaves.' },
        { q: 'What is the plural of "paragraph"?', c: ['paragraph', 'paragraphes', 'paragraphs', 'paragraphies'], a: 2, why: 'Just add -s: paragraphs.' },
        { q: 'What is the plural of "bench"?', c: ['benchs', 'benches', 'benchies', 'bench'], a: 1, why: 'Words ending in -ch, -sh, -s, -x or -z add -es: benches.' },
        { q: 'What is the root word of "mistreat"?', c: ['mis', 'treat', 'mistr', 'eat'], a: 1, why: '"Mis-" is a prefix. The root word is "treat."' },
        { q: 'What is the root word of "reopened"?', c: ['re', 'open', 'ope', 'opened'], a: 1, why: '"Re-" is a prefix and "-ed" is a suffix. The root is "open."' },
        { q: 'Which prefix means "again"?', c: ['un-', 're-', 'dis-', 'mis-'], a: 1, why: '"Re-" means again, like rewrite and reopen.' },
        { q: 'thank + ___ = a word that means "full of thanks"', c: ['-ful', '-ness', '-ly', '-er'], a: 0, why: 'thank + ful = thankful.' },
        { q: 'Which word is an adjective (a describing word)?', c: ['boat', 'jump', 'spicy', 'beam'], a: 2, why: '"Spicy" describes a noun, like spicy soup.' },
        { q: 'Which word is a verb (an action word)?', c: ['basket', 'curtain', 'throw', 'home'], a: 2, why: '"Throw" is something you do.' },
        { q: 'Which word is a proper noun?', c: ['nurse', 'library', 'Denver', 'week'], a: 2, why: 'Proper nouns name a specific place, person or thing, and start with a capital letter: Denver.' },
        { q: 'What two words make the contraction "I\'ve"?', c: ['I have', 'I will', 'I am', 'I had'], a: 0, why: "I've = I have." },
        { q: 'What two words make the contraction "won\'t"?', c: ['will not', 'want not', 'was not', 'would not'], a: 0, why: "Won't is a tricky one: it means will not." },
        { q: 'Vincent took his pet ___ the vet.', c: ['two', 'to', 'too', 'toe'], a: 1, why: '"To" shows direction: to the vet.' },
        { q: '___ going to the museum.', c: ['There', 'Their', "They're", 'Theyre'], a: 2, why: "They're = they are. \"They are going to the museum.\"" },
        { q: '___ house is near the school.', c: ['There', 'Their', "They're", 'Thier'], a: 1, why: '"Their" means it belongs to them.' },
        { q: 'Which word is spelled correctly?', c: ['honist', 'veiw', 'observe', 'wether'], a: 2, why: 'The right spellings are honest, view, observe and weather.' }
      ]
    },
    'j-volume': {
      title: 'Volume & Measurement Check',
      emoji: '🧊',
      note: 'Unit 1: Volume, plus measurement review',
      questions: [
        { q: 'Which is the rule for the volume of a box?', c: ['length + width + height', 'length × width × height', 'length × width', '2 × length + 2 × width'], a: 1, why: 'Volume = length × width × height (or area of the base × height).' },
        { q: 'A box is 7 units long, 4 units wide and 3 units tall. What is its volume?', c: ['14 cubic units', '84 cubic units', '28 cubic units', '74 cubic units'], a: 1, why: '7 × 4 = 28, and 28 × 3 = 84.' },
        { q: 'A box is 5 by 2 by 6. Which expression does NOT show its volume?', c: ['10 × 6', '(5 × 2) × 6', '30 × 2', '(5 × 2) × 2'], a: 3, why: '(5 × 2) × 2 = 20, but the volume is 60. The height 6 is missing!' },
        { q: 'True or false: (5 × 4) × 7 = 5 × (4 × 7)', c: ['True', 'False'], a: 0, why: 'True! You can group factors any way you like: both are 140.' },
        { q: 'True or false: 30 × 50 = 3 × 10 × 5', c: ['True', 'False'], a: 1, why: 'False. 30 × 50 = 1,500 but 3 × 10 × 5 = 150. The 50 is 5 × 10, so a 10 is missing.' },
        { q: 'A cube-shaped container is 7 inches deep. What is its volume?', c: ['21 cubic inches', '49 cubic inches', '343 cubic inches', '147 cubic inches'], a: 2, why: 'A cube has the same length, width and height: 7 × 7 × 7 = 343.' },
        { q: 'How many feet are in 1 yard?', c: ['3', '12', '36', '10'], a: 0, why: '1 yard = 3 feet = 36 inches.' },
        { q: 'Which is the LONGEST?', c: ['4 feet', '1 yard', '38 inches'], a: 0, why: '4 feet = 48 inches, 1 yard = 36 inches. So 4 feet is longest.' },
        { q: 'Which holds the MOST?', c: ['10 pints', '3 quarts', '1 gallon'], a: 0, why: '10 pints = 5 quarts. 1 gallon = 4 quarts. So 10 pints is the most.' },
        { q: 'Which is the SHORTEST?', c: ['1 km', '2,000 m', '100 cm'], a: 2, why: '100 cm = 1 meter, much shorter than 1 km (1,000 m) or 2,000 m.' },
        { q: 'A room is 9 feet wide and twice as long as it is wide. What is the perimeter?', c: ['34 feet', '54 feet', '27 feet', '162 feet'], a: 1, why: 'Length = 18. Perimeter = 18 + 9 + 18 + 9 = 54 feet. Add all four sides!' },
        { q: 'An angle that measures 120° is…', c: ['acute', 'right', 'obtuse', 'straight'], a: 2, why: 'Bigger than 90° but less than 180° is obtuse.' },
        { q: '2/10 + ?/100 = 48/100. What is the missing fraction?', c: ['46/100', '28/100', '2/100', '48/100'], a: 1, why: '2/10 = 20/100. 48 − 20 = 28, so it is 28/100.' }
      ]
    },
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
