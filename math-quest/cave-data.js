/* Deep Down: The Science Cave — science content.
   tiers: 0 = grades 1-4, 1 = grades 5-8, 2 = grades 9-12.  y = young text, o = older text, h = high-school extra. */
(function(){
const CD={};

/* ---------- layers (rows in the dig world) ----------
   depth in km at top/bottom, temperature °C at top/bottom (about 20 °C per km in the crust, matching the Kola borehole: 180 °C at 12 km) */
CD.LAYERS=[
 {id:'soil',n:'Topsoil',e:'🌱',r0:1,r1:12,km0:0,km1:0.01,t0:15,t1:15,rock:['soil','clay'],col:'#8a5a35',col2:'#6e4526',
  y:'Topsoil is dirt made from tiny bits of broken rock mixed with rotted plants. Worms and ants live here!',
  o:'Soil forms when weathering breaks rock into sand, silt and clay, then living things add humus (rotted plant matter). A few metres down the temperature stays about the same all year.'},
 {id:'sed',n:'Rock Layers',e:'🪨',r0:13,r1:30,km0:0.01,km1:0.8,t0:15,t1:30,rock:['sandstone','shale'],col:'#c49a5c',col2:'#9c7440',
  y:'These stripes are sedimentary rock: sand and mud that piled up and turned to stone. Deeper stripes are older!',
  o:'Sedimentary rock forms when layers of sediment are buried and squeezed (compaction) and glued by minerals (cementation). The Law of Superposition: lower layers were laid down first, so they are older.'},
 {id:'cave',n:'Limestone Caves',e:'🦇',r0:31,r1:48,km0:0.8,km1:2.2,t0:30,t1:58,rock:['limestone'],col:'#b9b3a3',col2:'#8f897a',
  y:'Rain water is a tiny bit acidic. Over thousands of years it dissolves holes in limestone and makes caves!',
  o:'Rainwater absorbs CO₂ and becomes weak carbonic acid, which slowly dissolves limestone (calcium carbonate). The deepest known caves, Krubera and Veryovkina in the country of Georgia, go down about 2.2 km.',
  hs:'H₂O + CO₂ → H₂CO₃, then CaCO₃ + H₂CO₃ → Ca(HCO₃)₂ (dissolved). When dripping water loses CO₂ the reaction runs backwards and calcite is deposited as stalactites.'},
 {id:'river',n:'Underground River',e:'🌊',r0:49,r1:62,km0:2.2,km1:3,t0:58,t1:75,rock:['limestone','dolomite'],col:'#6f8fa3',col2:'#4f6d80',
  y:'Water can flow deep underground, through cracks and caves. Some of it has been hidden down here for a super long time!',
  o:'Groundwater fills the spaces in rock like water in a sponge (an aquifer). In a Canadian mine about 3 km down, scientists found water that has been trapped for around 2 billion years — the oldest water ever found.'},
 {id:'crystal',n:'Crystal Caverns',e:'💎',r0:63,r1:80,km0:3,km1:4,t0:75,t1:95,rock:['dolomite','marble'],col:'#7b6aa8',col2:'#57497f',
  y:'When mineral-filled water sits still for a long time, crystals grow — some bigger than a school bus!',
  o:'Crystals grow when atoms line up in repeating patterns as mineral-rich water cools or evaporates slowly. In Mexico\'s Naica cave, gypsum crystals grew up to 12 m long in hot water over about half a million years. Some minerals glow under ultraviolet light — that\'s called fluorescence.'},
 {id:'granite',n:'Deep Crust',e:'⛏️',r0:81,r1:98,km0:4,km1:12,t0:95,t1:180,rock:['granite','gneiss'],col:'#8d7d82',col2:'#665960',
  y:'Hard granite rock can hold veins of metals like gold. The deepest hole people ever dug is about this deep!',
  o:'Granite is igneous rock that cooled slowly underground, so its crystals (quartz, feldspar, mica) grew big enough to see. The Kola Superdeep Borehole in Russia reached 12.2 km — the deepest hole ever drilled — and it was about 180 °C at the bottom.'},
 {id:'magma',n:'Magma Chambers',e:'🌋',r0:99,r1:116,km0:12,km1:35,t0:180,t1:650,rock:['basalt','gabbro'],col:'#5b3a3a',col2:'#3e2626',
  y:'Deep down it is so hot that some rock melts into magma — about 700 to 1,300 °C! When magma comes out of a volcano we call it lava.',
  o:'The solid rock around you here is about 180–650 °C, but pockets of melted rock (magma) are much hotter: about 700–1,300 °C. Magma rises and collects in chambers below volcanoes. Lava that cools fast becomes glassy obsidian; magma that cools slowly underground grows crystals (gabbro, granite). The bottom of the crust (the Moho) is about 35 km down under continents.'},
 {id:'mantle',n:'The Mantle',e:'🔥',r0:117,r1:136,km0:35,km1:200,t0:650,t1:1300,rock:['peridotite','eclogite'],col:'#6b2a1f',col2:'#4a1b14',
  y:'The mantle is hot, squishy rock that moves super slowly — about as slowly as your fingernails grow. Diamonds are made down here!',
  o:'The mantle is solid rock that flows very slowly (a few cm per year), carrying heat up by convection. It is mostly peridotite, rich in olivine. Diamonds form about 150–200 km down, where the pressure is over 45,000 times the air pressure at the surface.',
  hs:'Diamond is only stable at high pressure; at the surface it is actually metastable and would (extremely slowly) turn into graphite. Kimberlite eruptions carry diamonds up fast enough that they survive.'}
];
CD.ROWS=137; CD.COLS=24;

/* ---------- rocks ---------- hardness decides which drill you need */
CD.ROCKS={
 soil:{n:'Soil',h:1,col:'#7a4f2e'},clay:{n:'Clay',h:2,col:'#9b5f3c'},
 sandstone:{n:'Sandstone',h:4,col:'#d2a66a'},shale:{n:'Shale',h:3,col:'#8a7a66'},
 limestone:{n:'Limestone',h:3,col:'#bdb6a4'},dolomite:{n:'Dolomite',h:4,col:'#a9a3b8'},marble:{n:'Marble',h:4,col:'#cfc8d8'},
 granite:{n:'Granite',h:6,col:'#a08f94'},gneiss:{n:'Gneiss',h:6,col:'#86767c'},
 basalt:{n:'Basalt',h:6,col:'#4a3c3c'},gabbro:{n:'Gabbro',h:6.5,col:'#3b3434'},
 peridotite:{n:'Peridotite',h:7,col:'#5e6b3a'},eclogite:{n:'Eclogite',h:7.5,col:'#6e3b35'},
 coredoor:{n:'Ultra-hard mantle rock',h:9.5,col:'#2b1a2e'}
};

/* ---------- gear ---------- */
CD.DRILLS=[
 {n:'Hand Shovel',e:'🪏',h:2.5,c:0,r:0},
 {n:'Steel Pick',e:'⛏️',h:4.5,c:150,r:5,why:'Steel (hardness about 5.5) can break rocks softer than itself.'},
 {n:'Hardened Drill',e:'🔩',h:6.5,c:600,r:20,why:'Heat-treated steel bits are harder, so they can grind granite and basalt (hardness 6).'},
 {n:'Carbide Drill',e:'⚙️',h:8.5,c:2500,r:80,why:'Tungsten carbide (hardness about 9) is one of the hardest things people make.'},
 {n:'Diamond Drill',e:'💎',h:10,c:5000,r:150,need:'diamond',why:'Only diamond (hardness 10) can scratch everything — so real deep drills have diamond tips!'}];
CD.SUITS=[
 {n:'Explorer Suit',e:'🧥',t:40,c:0,r:0},
 {n:'Cooling Vest',e:'🦺',t:80,c:200,r:8},
 {n:'Heat Suit',e:'🥼',t:200,c:900,r:30},
 {n:'Thermal Armor',e:'🛡️',t:700,c:2500,r:90},
 {n:'Magma Armor',e:'🔥',t:1400,c:5000,r:160},
 /* the sixth suit is the way in to the Core Keeper (cave.js): owning it lets the Mantle floor crack */
 {n:'Core Suit',e:'🧑‍🚀',t:6000,c:9000,r:250,core:1,why:'Dr. Quartz says: "This is the one invention of mine that could never work in real life. No suit could. But in Math Quest we can pretend!"'}];
/* Solar panels at camp (Oct 2026). In Math Quest the helmet battery never charges by itself (math Power Ups are the way). Panels fill
   a Camp Battery Bank at their real rate in daylight (the device's clock), even while the game is closed; at camp the kid plugs in
   to move stored energy into the helmet (cave.js, plugIn). Real units: 1 battery energy point = WH_PER_ENERGY watt-hours, so the
   starting 60-point helmet battery holds 120 Wh and the starting bank 240 Wh. Time to fill = Wh ÷ watts: 1 small panel (10 W) fills
   the starting bank in 24 hours of daylight (two days), 4 high-power panels (720 W) in 20 minutes. Each step swaps in more AND
   better panels, which is how a real array grows that fast. */
CD.WH_PER_ENERGY=2;
CD.SOLAR=[{e:'🌑',n:'No solar panels',w:0,c:0},
 {e:'☀️',n:'1 Small Solar Panel',panels:1,each:10,w:10,c:1500,r:40,why:'Solar panels turn sunlight straight into electricity. A small panel is slow: it takes two days of daylight to fill your camp battery bank.'},
 {e:'☀️',n:'2 Medium Solar Panels',panels:2,each:20,w:40,c:2500,r:70,why:'Two bigger panels catch more sunlight, so they make more electricity.'},
 {e:'☀️',n:'3 Large Solar Panels',panels:3,each:50,w:150,c:4000,r:110,why:'Three large panels: now it really adds up.'},
 {e:'🌞',n:'4 High-Power Solar Panels',panels:4,each:180,w:720,c:6000,r:160,why:'A full array of the best panels. About twenty minutes of daylight fills your starting camp bank.'}];
CD.BANK=[{e:'🔋',n:'Camp Battery Bank',wh:240,c:0},
 {e:'🔋',n:'Big Camp Bank',wh:600,c:2000,r:60,why:'A bigger bank stores more sunshine for later.'},
 {e:'🔋',n:'Mega Camp Bank',wh:1200,c:4500,r:120,why:'Enough stored sunshine for many charges.'}];
CD.BATT=[{v:60,c:0},{v:100,c:150},{v:160,c:400},{v:250,c:900},{v:400,c:2000}];
CD.PACK=[{v:8,c:0},{v:12,c:100},{v:18,c:350},{v:25,c:800},{v:35,c:1600}];
CD.LAMP=[{v:3,c:0},{v:4,c:120},{v:5,c:400},{v:6,c:900}];
CD.UV={c:400,r:15};

/* ---------- lab tests ---------- */
CD.TOOLS=[{id:'nail',n:'Fingernail',h:2.5,e:'💅'},{id:'coin',n:'Copper coin',h:3.5,e:'🪙'},{id:'steel',n:'Steel nail',h:5.5,e:'📍'},{id:'quartz',n:'Quartz point',h:7,e:'🔺'}];
CD.PLATE=6.5; /* streak plate (unglazed porcelain) */
CD.TESTS=[
 {id:'look',n:'Look',e:'🔍'},{id:'scratch',n:'Scratch',e:'💅'},{id:'streak',n:'Streak',e:'⬜'},
 {id:'acid',n:'Acid drop',e:'🧪'},{id:'magnet',n:'Magnet',e:'🧲'},{id:'water',n:'Water',e:'💧'},{id:'uv',n:'UV lamp',e:'🔦',uv:1}];

/* ---------- minerals ----------
 h hardness (Mohs) · s streak color (null = harder than the plate, no streak) · f fizzes in acid · m magnetic · u UV glow color · w dissolves in water
 look: color + shape · r rarity 1..4 · L layers found in */
CD.MIN={
 quartz:{n:'Quartz',h:7,s:null,col:'#e8f1ff',sh:'crystal',look:'clear, glassy six-sided crystal',r:1,L:['soil','sed','crystal','granite'],
  y:'Quartz is one of the most common minerals on Earth. Sand on the beach is mostly tiny bits of quartz!',o:'Quartz (SiO₂) is harder than steel, so it scratches glass. When squeezed it makes a tiny electric voltage (piezoelectricity) — that is how quartz watches keep time.'},
 mica:{n:'Mica',h:2.5,s:'#ffffff',col:'#c9c2a8',sh:'sheet',look:'shiny, peels into paper-thin sheets',r:1,L:['soil','granite'],
  y:'Mica peels apart into sheets thinner than paper. It makes makeup and paint sparkly!',o:'Mica splits perfectly in one direction (cleavage) because its atoms are stacked in sheets held together weakly. Big sheets were once used as windows in old stoves.'},
 gypsum:{n:'Gypsum',h:2,s:'#ffffff',col:'#f3efe4',sh:'crystal',look:'soft, white-clear, pearly',r:1,L:['soil','sed','cave','crystal'],
  y:'Gypsum is so soft your fingernail can scratch it. It is used to make the walls in your house (drywall)!',o:'Gypsum (CaSO₄·2H₂O) is #2 on the Mohs scale. The giant crystals of Naica, Mexico — up to 12 m long — are a clear form of gypsum called selenite.'},
 halite:{n:'Halite',h:2.5,s:'#ffffff',col:'#f5f7ff',sh:'cube',look:'clear cubes',w:1,r:1,L:['sed'],
  y:'Halite is rock salt — the same salt you put on food! Its crystals grow in perfect little cubes.',o:'Halite (NaCl) forms when salty seas evaporate. Its sodium and chlorine atoms line up in a cube pattern, so it breaks into cubes. Geologists never taste unknown minerals — some are poisonous — so we test if it dissolves in water instead.'},
 pyrite:{n:'Pyrite',h:6.5,s:'#2f3a2a',col:'#d9b93a',sh:'cube',look:'brassy gold-colored cubes',r:2,L:['sed','granite'],
  y:'Pyrite is called Fool\'s Gold because it tricked miners! Real gold is soft, but pyrite is hard.',o:'Pyrite (FeS₂) looks like gold but leaves a greenish-black streak, while gold leaves a gold streak. It is also much harder than gold. A streak test beats your eyes!'},
 calcite:{n:'Calcite',h:3,s:'#ffffff',col:'#f1e6cf',sh:'crystal',look:'white to honey-colored, glassy',f:1,u:'#ff5a3d',r:1,L:['cave','river','crystal'],
  y:'Calcite fizzes when you drop acid on it! Caves, stalactites and seashells are made of it.',o:'Calcite (CaCO₃) makes limestone, marble, stalactites and seashells. It fizzes in acid because it releases carbon dioxide gas. Clear calcite makes things look doubled when you look through it!',
  hs:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Clear calcite (Iceland spar) shows double refraction because light travels at two speeds through its crystal lattice.'},
 fluorite:{n:'Fluorite',h:4,s:'#ffffff',col:'#9b6bff',sh:'cube',look:'purple or green glassy cubes',u:'#5cc8ff',r:2,L:['cave','crystal'],
  y:'Fluorite glows under a special purple light (UV light)! The word "fluorescent" comes from fluorite.',o:'Fluorite (CaF₂) is #4 on the Mohs scale. Under ultraviolet light it glows blue — this glowing was named fluorescence after it. It is used to make toothpaste fluoride and special camera lenses.',
  hs:'Fluorescence: an electron absorbs a high-energy UV photon, loses some energy as heat, then drops back down emitting a lower-energy (longer wavelength) visible photon.'},
 malachite:{n:'Malachite',h:4,s:'#8fe3a9',col:'#1f9d5a',sh:'round',look:'bright green with swirly bands',f:1,r:2,L:['river'],
  y:'Malachite is bright green because it has copper in it — like the green on old pennies!',o:'Malachite (Cu₂CO₃(OH)₂) is a copper carbonate, so like calcite it fizzes in acid. Its green bands form as copper-rich water drips and deposits layer after layer.'},
 azurite:{n:'Azurite',h:3.5,s:'#8ec5ff',col:'#1f4fd1',sh:'crystal',look:'deep blue crystals',f:1,r:3,L:['river'],
  y:'Azurite is a deep blue copper mineral. Long ago painters crushed it to make blue paint!',o:'Azurite is a copper carbonate like malachite, and over time it can slowly turn into malachite by absorbing water. Both fizz in acid; azurite leaves a light-blue streak.'},
 willemite:{n:'Willemite',h:5.5,s:'#ffffff',col:'#c8bfa4',sh:'round',look:'dull, greyish-tan',u:'#39ff6a',r:3,L:['crystal'],
  y:'Willemite looks boring in normal light — but under UV light it glows bright neon green!',o:'Willemite (a zinc silicate) is one of the brightest fluorescent minerals. In normal light it is dull; under shortwave UV it glows electric green. Franklin, New Jersey is famous for it.'},
 feldspar:{n:'Feldspar',h:6,s:'#ffffff',col:'#f2b8a2',sh:'crystal',look:'pink or white blocky crystals',r:1,L:['granite'],
  y:'Feldspar is the pink stuff in granite. It is the most common mineral in Earth\'s crust!',o:'Feldspars make up about half of Earth\'s crust. Pink potassium feldspar gives granite its color. When feldspar weathers it turns into clay.'},
 magnetite:{n:'Magnetite',h:6,s:'#1b1b1b',col:'#2e2e33',sh:'crystal',look:'heavy, black, metallic',m:1,r:2,L:['granite','magma'],
  y:'Magnetite sticks to magnets, and some pieces (lodestones) are natural magnets that can pick up paper clips!',o:'Magnetite (Fe₃O₄) is the most magnetic natural mineral. Pieces magnetized by lightning, called lodestones, were used to make the very first compasses.'},
 hematite:{n:'Hematite',h:6,s:'#8b2a1e',col:'#4b4b52',sh:'round',look:'silvery-grey metal',r:2,L:['granite'],
  y:'Hematite looks silver, but when you rub it on a tile it leaves a red mark — like dried blood! Mars is red because of it.',o:'Hematite (Fe₂O₃) is iron oxide — basically rust. Even silver-looking hematite leaves a red-brown streak. It is the main ore of iron, and it gives Mars its red color.'},
 gold:{n:'Gold',h:2.5,s:'#e8b923',col:'#ffcc33',sh:'nugget',look:'bright gold nugget, very heavy',r:3,L:['granite'],
  y:'Real gold is soft — you could dent it with a coin! It never rusts, so it stays shiny forever.',o:'Gold is soft (2.5) and super heavy — about 19 times heavier than the same amount of water. It never rusts or tarnishes. Unlike pyrite, gold leaves a gold streak and can be dented.'},
 galena:{n:'Galena',h:2.5,s:'#5a5f66',col:'#9aa0a8',sh:'cube',look:'shiny silver-grey cubes, heavy',r:2,L:['granite'],
  y:'Galena is heavy, shiny and grows in cubes. It has lead in it, so we wash hands after touching it!',o:'Galena (PbS) is the main ore of lead. It breaks into perfect cubes and leaves a lead-grey streak. Early radios, called crystal sets, used galena crystals to pick up signals.'},
 garnet:{n:'Garnet',h:7.5,s:null,col:'#8e1b2b',sh:'round',look:'deep red, round 12-sided crystals',r:2,L:['granite','mantle'],
  y:'Garnet is a dark red gem. It is so hard that people glue it to sandpaper!',o:'Garnet forms under high heat and pressure. At 7.5 it is harder than the streak plate, so it leaves no streak. Crushed garnet is used for sandpaper and water-jet cutting.'},
 corundum:{n:'Corundum',h:9,s:null,col:'#d4264e',sh:'crystal',look:'hard red or blue six-sided crystal',u:'#ff2a2a',r:4,L:['granite'],
  y:'Red corundum is a ruby and blue corundum is a sapphire! Only diamond is harder.',o:'Corundum (Al₂O₃) is #9 on the Mohs scale. Tiny amounts of chromium make it red (ruby) and glow red under UV; iron and titanium make it blue (sapphire).'},
 obsidian:{n:'Obsidian',h:5.5,s:'#ffffff',col:'#161320',sh:'glass',look:'black shiny glass with sharp edges',r:2,L:['magma'],notMin:1,
  y:'Obsidian is volcanic glass! Lava cooled so fast that crystals had no time to grow.',o:'Obsidian is not really a mineral — it has no crystal structure, because lava cooled too quickly for atoms to line up. Its edges can be sharper than a steel scalpel, so ancient people made arrowheads from it.'},
 sulfur:{n:'Sulfur',h:2,s:'#fff59a',col:'#f6e03a',sh:'crystal',look:'bright yellow crystals from stinky volcano vents',r:2,L:['magma'],
  y:'Sulfur is bright yellow and forms near volcanoes. Stinky volcano gas smells like rotten eggs!',o:'Native sulfur crystallizes from volcanic gases around vents called fumaroles. The rotten-egg smell is hydrogen sulfide gas (H₂S). Sulfur is used to make matches and fertilizer.'},
 olivine:{n:'Olivine',h:6.5,s:'#ffffff',col:'#9bbf2e',sh:'round',look:'olive-green glassy grains',r:2,L:['magma','mantle'],
  y:'Olivine is green like an olive. Much of the upper mantle is made of it! Gem olivine is called peridot.',o:'Olivine ((Mg,Fe)₂SiO₄) is the main mineral of the upper mantle. Some beaches in Hawaii have green sand made of olivine washed out of lava.'},
 diamond:{n:'Diamond',h:10,s:null,col:'#dff6ff',sh:'crystal',look:'super sparkly, eight-sided crystal',u:'#7fb6ff',r:4,L:['mantle'],
  y:'Diamond is the hardest natural thing on Earth! It is made of carbon — the same stuff as pencil lead.',o:'Diamond is pure carbon squeezed at over 45,000 atmospheres about 150–200 km down. Graphite (pencil lead) is also pure carbon — the only difference is how the atoms are arranged!',
  hs:'In diamond each carbon atom bonds to 4 others in a rigid 3D tetrahedral network; in graphite each bonds to 3 in flat sheets that slide. Same element, different structure: these are called allotropes.'}
};
CD.RAR={1:{n:'Common',c:25,sell:4,rp:3,w:10},2:{n:'Uncommon',c:50,sell:8,rp:5,w:5},3:{n:'Rare',c:100,sell:15,rp:8,w:2},4:{n:'Epic',c:250,sell:40,rp:15,w:1}};

/* ---------- fossils: deeper = older ---------- */
/* x = the exhibit card in the Museum (what it was, how big, what it ate, where it lived), shown once the skeleton is built */
CD.FOSSILS=[
 {id:'mammoth',x:{what:"A mammal, and a cousin of today's elephants",size:'About 3 metres tall at the shoulder and as heavy as a big elephant',ate:'Grass and other plants',where:'Europe, Asia and North America. Some have been found frozen in the ground in Siberia with their fur still on'},n:'Woolly Mammoth',e:'🦣',L:'soil',age:'about 20,000 years ago',ageY:20e3,parts:['Skull','Tusk','Ribs','Legs'],
  y:'Woolly mammoths lived in the Ice Age. They had shaggy fur and tusks up to 4 metres long!',o:'Woolly mammoths lived during the last Ice Age. The last small group survived on Wrangel Island until about 4,000 years ago — after the Egyptian pyramids were built!'},
 {id:'trex',x:{what:'A meat-eating dinosaur',size:'About 12 metres long, as long as a bus',ate:'Other dinosaurs, such as Triceratops',where:'Western North America'},n:'T. rex',e:'🦖',L:'sed',top:1,age:'66 million years ago',ageY:66e6,parts:['Skull','Arms','Ribs','Legs','Tail'],
  y:'T. rex had teeth as big as bananas and one of the strongest bites of any land animal ever!',o:'Tyrannosaurus rex lived 68–66 million years ago, right before an asteroid impact wiped out the non-bird dinosaurs. Birds are living dinosaurs — T. rex is more closely related to a chicken than to Stegosaurus!'},
 {id:'brachio',x:{what:'A plant-eating dinosaur with a very long neck (a sauropod)',size:'About 22 metres long and 12 metres tall',ate:'Leaves from the tops of tall trees',where:'North America'},n:'Brachiosaurus',e:'🦕',L:'sed',top:0,age:'150 million years ago',ageY:150e6,parts:['Skull','Neck','Ribs','Legs','Tail'],
  y:'Brachiosaurus was as tall as a 4-story building and ate leaves from the tops of trees!',o:'Brachiosaurus lived about 154–153 million years ago in the Jurassic. It was deeper in the rock than T. rex because it lived almost 90 million years earlier.'},
 {id:'ammonite',x:{what:'A sea animal with a spiral shell, related to squid and octopus',size:'Most were smaller than your hand. The biggest were almost 2 metres across',ate:'Small sea animals',where:'Seas all over the world. They died out at the same time as the big dinosaurs'},n:'Ammonite',e:'🐚',L:'cave',top:1,age:'200 million years ago',ageY:200e6,parts:['Shell','Spiral','Chambers'],
  y:'Ammonites were sea animals with spiral shells, cousins of octopus and squid!',o:'Ammonites swam in ancient oceans for over 300 million years. Most limestone is made from sea shells and skeletons, so finding sea fossils in a cave tells us this land was once under the ocean.'},
 {id:'trilobite',x:{what:'A sea animal with a hard shell and jointed legs, in the same big group as crabs and insects',size:'Most were 3 to 10 centimetres long. The biggest were about 70 centimetres',ate:'Different kinds ate different things, such as tiny animals or scraps on the sea floor',where:'Sea floors all over the world'},n:'Trilobite',e:'trilobite',L:'cave',top:0,age:'500 million years ago',ageY:500e6,parts:['Head','Body','Tail'],
  y:'Trilobites were bug-like sea animals that lived before the dinosaurs. They had some of the first eyes ever!',o:'Trilobites appeared about 521 million years ago and had eyes made of calcite crystals. They lived for about 270 million years before dying out — much longer than the dinosaurs.'},
 {id:'stromatolite',x:{what:'Not an animal: layers of rock built up very slowly by mats of tiny microbes',size:'From a few centimetres to more than a metre tall',ate:'The microbes made their own food from sunlight',where:'The oldest are in Western Australia. Living ones still grow today in Shark Bay, Australia'},n:'Stromatolite',e:'🪨',L:'river',top:0,age:'3.5 billion years ago',ageY:3.5e9,parts:['Base','Layers','Top'],
  y:'Stromatolites were made by tiny living things. They are some of the oldest signs of life on Earth!',o:'Stromatolites are rocky layers built by mats of microbes. The oldest are about 3.5 billion years old! Later, microbes called cyanobacteria built them too, and they were the first living things to fill the air with oxygen.'},
 /* Sep 2026 — Adventure Camp fossils. Most pieces are dug in the cave as usual, but the piece at index `camp` is NEVER spawned by the cave:
    only an Adventure Camp crew can bring it home (very rarely; see cleanup.js). `art` is an inline SVG used instead of the emoji where it fits. */
 {id:'smilodon',x:{what:'A mammal, from a branch of the cat family that has died out',size:'About 1 metre tall at the shoulder, and about as heavy as a lion, or heavier',ate:'Big animals such as bison',where:'North and South America'},n:'Sabre-toothed Cat',e:'🐅',L:'soil',top:0,camp:0,age:'about 15,000 years ago',ageY:15e3,parts:['Fang Skull','Ribs','Legs','Tail'],
  y:'Sabre-toothed cats (Smilodon) had two giant fangs as long as a banana! Lots of their bones were found in the La Brea Tar Pits in Los Angeles.',o:'Smilodon lived in the Americas during the Ice Ages and died out about 10,000 years ago. Its fangs were about 18 cm long, and even longer in the biggest kind. Bones from more than 2,000 Smilodon have been pulled out of the sticky La Brea Tar Pits in Los Angeles. It was a cat, but not a tiger: it belonged to a different, now-extinct branch of the cat family.'},
 {id:'triceratops',x:{what:'A plant-eating dinosaur with three horns and a bony frill',size:'About 9 metres long, and heavier than an elephant',ate:'Low plants, snipped off with its beak',where:'Western North America'},n:'Triceratops',e:'🦕',L:'sed',top:1,camp:0,age:'67 million years ago',ageY:67e6,parts:['Horned Skull','Ribs','Legs','Tail'],
  y:'Triceratops means "three-horned face". It ate plants and had a giant bony frill on its head!',o:'Triceratops lived about 68–66 million years ago, at the same time as T. rex. Its skull, with the frill, could be over 2 metres long — one of the biggest heads of any land animal ever.'},
 {id:'pteranodon',x:{what:'A flying reptile called a pterosaur. Not a dinosaur and not a bird',size:'Wings up to about 6 metres across, with a light body',ate:'Fish',where:'North America, over a shallow sea that covered the middle of the continent back then'},n:'Pteranodon',e:'🦅',L:'sed',top:1,camp:0,age:'85 million years ago',ageY:85e6,parts:['Crested Skull','Wings','Body','Legs'],
  y:'Pteranodon flew over the ocean on wings as wide as a giraffe is tall! It was not a dinosaur — it was a flying reptile called a pterosaur.',o:'Pteranodon lived about 86–84 million years ago and had a wingspan of up to about 6 metres. Its wings were skin stretched from one super-long finger. Pterosaurs were cousins of the dinosaurs, not dinosaurs themselves, and not birds.'},
 {id:'stego',x:{what:'A plant-eating dinosaur with plates on its back',size:'Up to about 9 metres long',ate:'Low plants such as ferns',where:'Western North America'},n:'Stegosaurus',e:'🦕',L:'sed',top:0,camp:1,age:'150 million years ago',ageY:150e6,parts:['Skull','Back Plates','Ribs','Legs','Spiky Tail'],
  y:'Stegosaurus had big plates on its back and spikes on its tail. Its brain was tiny for such a big animal!',o:'Stegosaurus lived about 155–150 million years ago in the Jurassic, around the same time as Brachiosaurus. The four spikes on its tail are nicknamed the "thagomizer". Its plates may have helped it show off or warm up in the sun.'}
];
/* little skeleton pictures for fossils that have no good emoji */
CD.FART={
 smilodon:'<svg viewBox="0 0 60 40" width="1.4em" height="1em" style="vertical-align:-.12em"><path d="M10 18 Q12 12 24 12 Q36 11 42 14 L44 26 Q30 29 14 27 Q8 25 10 18Z" fill="#c9a36b"/><path d="M40 10 Q48 6 54 11 Q58 15 55 20 L46 22 Q40 18 40 10Z" fill="#b08447"/><path d="M42 9 L44 4 L47 8Z" fill="#b08447"/><path d="M49 20 L50 30 L52 20 M53 19 L54 28 L55 19" fill="#fffdf5" stroke="#8a6532" stroke-width="1"/><circle cx="50" cy="12" r="1.6" fill="#3b2f25"/><path d="M16 27 v10 M23 28 v9 M35 28 v9 M41 26 v11" stroke="#9c7440" stroke-width="3.5" stroke-linecap="round"/><path d="M10 19 Q4 20 2 26" stroke="#9c7440" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 15 q3 4 0 8 M28 14 q3 4 0 8" stroke="#8a6532" stroke-width="1.5" fill="none" opacity=".6"/></svg>',
 trilobite:'<svg viewBox="0 0 40 40" width="1em" height="1em" style="vertical-align:-.12em"><ellipse cx="20" cy="21" rx="12" ry="16" fill="#9c8468"/><path d="M8 12 Q20 2 32 12 Q20 16 8 12Z" fill="#7a6650"/><g stroke="#5e4c3a" stroke-width="1.6">'+[16,20,24,28,32].map(y=>'<line x1="10" y1="'+y+'" x2="30" y2="'+y+'"/>').join('')+'</g><line x1="20" y1="10" x2="20" y2="36" stroke="#5e4c3a" stroke-width="2"/></svg>',
 triceratops:'<svg viewBox="0 0 60 40" width="1.4em" height="1em" style="vertical-align:-.12em"><path d="M8 26 Q10 14 26 13 Q40 12 46 20 L44 30 Q30 33 12 31Z" fill="#9c8468"/><path d="M42 10 Q54 6 58 18 Q56 26 46 26 Q40 20 42 10Z" fill="#b39a7c"/><path d="M50 17 L60 12 M47 13 L52 2 M54 22 L60 22" stroke="#5e4c3a" stroke-width="2.4" stroke-linecap="round"/><path d="M14 30 v8 M22 31 v7 M34 31 v7 M41 30 v8" stroke="#7a6650" stroke-width="3.5" stroke-linecap="round"/><path d="M8 24 Q2 26 0 30" stroke="#7a6650" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="52" cy="17" r="1.6" fill="#3b2f25"/></svg>',
 pteranodon:'<svg viewBox="0 0 60 40" width="1.4em" height="1em" style="vertical-align:-.12em"><path d="M30 20 L4 10 Q14 18 12 26 Z M30 20 L56 10 Q46 18 48 26 Z" fill="#9c8468"/><ellipse cx="30" cy="22" rx="5" ry="7" fill="#7a6650"/><path d="M30 15 L36 8 L46 10 L36 12 Z" fill="#b39a7c"/><path d="M33 10 L22 4" stroke="#5e4c3a" stroke-width="2.4" stroke-linecap="round"/><path d="M28 29 v6 M32 29 v6" stroke="#5e4c3a" stroke-width="2" stroke-linecap="round"/></svg>',
 stego:'<svg viewBox="0 0 60 40" width="1.4em" height="1em" style="vertical-align:-.12em"><path d="M14 20 L18 8 L22 18 L26 5 L30 17 L34 6 L38 18 L42 10 L44 20Z" fill="#c9a36b"/><path d="M6 24 Q14 16 30 16 Q46 16 52 24 Q52 30 46 30 L14 30 Q6 30 6 24Z" fill="#9c8468"/><path d="M52 24 Q58 22 60 25 Q57 28 52 27Z" fill="#9c8468"/><path d="M6 24 Q2 22 1 20 M3 25 L0 29" stroke="#5e4c3a" stroke-width="2.2" stroke-linecap="round"/><path d="M16 30 v8 M24 30 v7 M36 30 v7 M44 30 v8" stroke="#7a6650" stroke-width="3.5" stroke-linecap="round"/></svg>'};

/* ---------- critters ---------- */
CD.CRITTERS=[
 {id:'worm',n:'Earthworm',e:'🪱',L:'soil',y:'Earthworms have no eyes or lungs — they breathe through their skin! They mix the soil and help plants grow.',o:'Earthworms breathe through moist skin and can have hundreds of tiny bristles for gripping. Charles Darwin spent 40 years studying them and showed they build new soil.'},
 {id:'ant',n:'Ant Colony',e:'🐜',L:'soil',y:'Ants dig tunnels and rooms underground, like a city with a nursery and pantry!',o:'Some ant nests go several metres deep and hold millions of ants. Ants talk using chemical smells called pheromones.'},
 {id:'fungus',n:'Glowing Fungus',e:'🍄',L:'sed',glow:1,y:'Some mushrooms glow in the dark! It is called foxfire.',o:'Bioluminescent fungi make light using a chemical reaction between luciferin and an enzyme called luciferase. Scientists think the glow attracts insects that spread their spores.'},
 {id:'bat',n:'Cave Bat',e:'🦇',L:'cave',y:'Bats "see" with sound! They shout and listen for the echo — that is echolocation.',o:'Bats send out calls too high for us to hear and time the echoes to find insects in total darkness. Some bats can hunt using echolocation alone.'},
 {id:'glowworm',n:'Glowworm',e:'✨',L:'cave',glow:1,y:'Glowworms light up cave ceilings like stars! They glow to catch bugs in sticky threads.',o:'New Zealand glowworms are fungus-gnat larvae. Their blue-green glow (bioluminescence) lures insects into sticky silk lines hanging from the cave ceiling.'},
 {id:'cricket',n:'Cave Cricket',e:'🦗',L:'cave',y:'Cave crickets have super long feelers to feel their way in the dark.',o:'Cave crickets have antennae longer than their bodies and no wings. They cannot see much, so touch and smell guide them.'},
 {id:'cavefish',n:'Blind Cave Fish',e:'🐟',L:'river',y:'Some cave fish have no eyes at all! In total darkness they do not need them.',o:'Mexican cave tetras evolved from fish with eyes. Over generations in darkness their eyes disappeared — growing eyes costs energy that is useless without light.'},
 {id:'olm',n:'Olm',e:'🦎',L:'river',y:'The olm is a pale cave salamander that can live over 100 years and go 10 years without eating!',o:'Olms live in flooded caves in Europe, can survive about a decade without food, and may live over 100 years. They sense light with their skin even though they are blind.'},
 {id:'crayfish',n:'Cave Crayfish',e:'🦞',L:'river',y:'Cave crayfish are see-through white because there is no sun to give them color.',o:'In the dark, color (pigment) is no use, so over many generations cave crayfish lost it. Some may live 20 years or more because of their slow, cold, low-energy life.'},
 {id:'tardigrade',n:'Water Bear',e:'🐻',L:'crystal',tiny:1,y:'Tardigrades are tiny "water bears" smaller than a grain of sand. They can survive drying out, freezing and even outer space!',o:'Tardigrades (0.5 mm) survive extreme conditions by drying out into a "tun" state, nearly stopping their metabolism. They have survived exposure to the vacuum of space.'},
 {id:'audax',n:'Bold Traveler Microbe',e:'🦠',L:'granite',tiny:1,y:'2.8 km deep in a gold mine, scientists found a tiny living thing that eats energy from radioactive rocks — no sunlight at all!',o:'Desulforudis audaxviator ("bold traveler") was found 2.8 km down in South Africa\'s Mponeng gold mine. It lives on chemicals made when radiation from rocks splits water — an ecosystem with no sunlight.'},
 {id:'strain121',n:'Heat-Lover Microbe',e:'🦠',L:'granite',tiny:1,hot:1,y:'This microbe loves heat! "Strain 121" was found at hot vents on the sea floor, where it grows at 121 °C — hotter than boiling water. Hot water in deep rock cracks like these gets that warm too.',o:'"Strain 121" is an archaeon found at hydrothermal vents — hot springs on the deep sea floor — that can grow at 121 °C, the temperature used to sterilize medical tools. Hot water in the deep crust reaches that temperature too. Life has limits, though: nothing we know of lives in magma or the mantle.'}
];

/* ---------- geodes (daily secret pocket) ---------- */
CD.GEODES=[{id:'amethyst',n:'Amethyst Geode',col:'#9b59ff',c:120,y:'Amethyst is purple quartz. Tiny bits of iron plus natural radiation turn it purple!'},
 {id:'agate',n:'Agate Geode',col:'#e58e4f',c:90,y:'Agate forms in rings as layer after layer of silica fills a hole in rock, like tree rings.'},
 {id:'celestine',n:'Celestine Geode',col:'#8fd3ff',c:150,y:'Celestine crystals are sky-blue. Its name comes from the Latin word for heavenly.'},
 {id:'citrine',n:'Citrine Geode',col:'#ffc23a',c:130,y:'Citrine is yellow-orange quartz, colored by tiny amounts of iron.'}];

/* ---------- questions (core probe + gates), first choice is correct ---------- */
CD.Q=[
 [ /* tier 0 */
  {q:'Which one is the hardest?',a:['Diamond','Chalk','Gold'],x:'Diamond is 10 on the hardness scale — the hardest natural thing!'},
  {q:'As you dig deeper into the Earth it gets…',a:['Hotter','Colder','Just the same'],x:'The deeper you go, the hotter it gets. The center of the Earth is as hot as the surface of the Sun!'},
  {q:'What makes stalactites grow?',a:['Dripping water leaves tiny bits of rock','Bats glue rocks together','Ice freezes on the roof'],x:'Each drip leaves a tiny bit of calcite behind. It takes hundreds of years to grow a few centimetres!'},
  {q:'How do bats find their way in the dark?',a:['By listening to echoes','By glowing','By smelling the walls'],x:'Bats make calls and listen for the echo. That is called echolocation.'},
  {q:'Where do we usually find the OLDEST fossils?',a:['Deeper down','Near the top','In the sky'],x:'Rock layers pile up over time, so the deeper layers are older.'},
  {q:'Which one sticks to a magnet?',a:['Magnetite','Quartz','Salt'],x:'Magnetite is a special iron mineral that is naturally magnetic, so it sticks to magnets.'},
  {q:'What is the very middle of the Earth called?',a:['The core','The crust','The moon'],x:'Earth has a crust, a mantle and a core in the middle.'},
  {q:'Which one floats in water?',a:['Wood','A rock','An iron nail'],x:'Wood is lighter than the same amount of water, so it floats.'},
  {q:'What do we call melted rock that is still underground?',a:['Magma','Lava','Mud'],x:'Underground it is magma. When it comes out of a volcano it is called lava.'},
  {q:'Why do some cave fish have no eyes?',a:['It is totally dark, so they do not need them','They are sleeping','They wear sunglasses'],x:'In total darkness eyes do not help, so over a long time the fish lost them.'}
 ],
 [ /* tier 1 */
  {q:'What does the Mohs scale measure?',a:['Hardness','Weight','Temperature','Age'],x:'Mohs ranks minerals 1–10 by which ones scratch which. Talc is 1, diamond is 10.'},
  {q:'Earth\'s layers from outside to inside are…',a:['Crust, mantle, outer core, inner core','Mantle, crust, inner core, outer core','Crust, core, mantle, magma','Core, crust, mantle, sky'],x:'Crust (thin skin) → mantle (thick, slowly flowing rock) → liquid outer core → solid inner core.'},
  {q:'Which layer of Earth is liquid metal?',a:['The outer core','The inner core','The crust','The upper mantle'],x:'The outer core is liquid iron and nickel. The inner core is solid because the pressure is so high.'},
  {q:'Why does calcite fizz in acid?',a:['It gives off carbon dioxide gas','It is melting','It contains soda','It is magnetic'],x:'Acid breaks calcium carbonate apart and releases CO₂ bubbles.'},
  {q:'Sound travels about 343 m/s in air. An echo returns after 1 second. How far is the wall?',a:['About 172 m','343 m','686 m','34 m'],x:'The sound goes there AND back, so distance = 343 × 1 ÷ 2 ≈ 172 m.'},
  {q:'An object floats when it is…',a:['Less dense than water','Heavier than 1 kg','Made of metal','Very long'],x:'It only sinks partway, until the water\'s upward push equals its weight.'},
  {q:'Why are lower rock layers usually older?',a:['Layers pile up on top of older ones','Old rocks are heavier','Heat makes rocks older','They are not'],x:'That is the Law of Superposition — new sediment settles on top of what is already there.'},
  {q:'What creates Earth\'s magnetic field?',a:['Moving liquid iron in the outer core','Magnets in the crust','The Moon','Lightning'],x:'Swirling liquid iron in the outer core acts like a giant electric generator (the geodynamo).'},
  {q:'Obsidian is glassy because the lava…',a:['Cooled very quickly','Cooled very slowly','Was frozen by ice','Had sugar in it'],x:'Fast cooling gives atoms no time to line up into crystals, so you get glass.'},
  {q:'On a lever, moving the fulcrum closer to the heavy load makes it…',a:['Easier to lift','Harder to lift','Exactly the same','Impossible'],x:'A longer effort arm multiplies your push: effort × effort-arm = load × load-arm.'}
 ],
 [ /* tier 2 */
  {q:'Which seismic waves cannot pass through the liquid outer core?',a:['S-waves','P-waves','Surface waves','Radio waves'],x:'S-waves are shear waves and liquids cannot be sheared. Their "shadow zone" is how we discovered the outer core is liquid.'},
  {q:'With a gradient of about 25 °C per km and 15 °C at the surface, the temperature at 4 km is about…',a:['115 °C','40 °C','100 °C exactly','415 °C'],x:'15 + 25 × 4 = 115 °C.'},
  {q:'CaCO₃ + 2HCl → CaCl₂ + H₂O + ? — what is the gas?',a:['CO₂','O₂','H₂','Cl₂'],x:'Carbon dioxide — that\'s the fizz.'},
  {q:'Diamond and graphite are both pure carbon. They differ in…',a:['How the atoms are bonded and arranged','Number of protons','Mass of each atom','Nothing — they are the same'],x:'They are allotropes: 3D tetrahedral network (diamond) vs flat sheets (graphite).'},
  {q:'By Archimedes\' principle, the buoyant force equals…',a:['The weight of the fluid displaced','The object\'s mass','The water\'s depth','Gravity × volume of the object × its density'],x:'F_b = ρ_fluid × V_displaced × g.'},
  {q:'The inner core is hotter than the outer core, yet solid. Why?',a:['The enormous pressure keeps it solid','It is made of rock','It is actually cooler','Magnetism freezes it'],x:'Pressure raises the melting point of iron more than the temperature rises with depth.'},
  {q:'A pulley system with 4 rope segments supporting the load has an ideal mechanical advantage of…',a:['4','2','8','1'],x:'IMA = number of supporting segments, but you pull 4× as much rope.'},
  {q:'The inner core\'s temperature (~5,400 °C) is closest to…',a:['The surface of the Sun','A kitchen oven','Lava from a volcano','Boiling water'],x:'The Sun\'s surface is about 5,500 °C.'},
  {q:'Pyrite ("fool\'s gold") has the formula…',a:['FeS₂','Au','Fe₂O₃','CuFeS₂'],x:'Iron disulfide. Fe₂O₃ is hematite; CuFeS₂ is chalcopyrite.'},
  {q:'A fluorescent mineral absorbs UV and emits visible light. The emitted light has…',a:['Lower energy and longer wavelength','Higher energy','The same wavelength','No wavelength'],x:'Some energy is lost as heat (Stokes shift), so the emitted photon has less energy.'},
  {q:'The S-wave arrives 20 s after the P-wave. Using the rule of thumb of about 8 km per second of lag, the quake is roughly…',a:['160 km away','20 km away','8 km away','1,600 km away'],x:'20 s × 8 km/s ≈ 160 km.'}
 ]];

/* ---------- mineral mini-guide for choosing the field guide difficulty ---------- */
CD.tier=g=>g<=4?0:g<=8?1:2;
/* ---------- the hammer-tap test: how each mineral breaks (cleavage and fracture) ----------
   sheets = one perfect cleavage (mica)            blocks = flat-sided pieces: cubes, slanted blocks, 8-sided bits
   chips  = no cleavage: rough or curved, glassy    crumbs = soft and crumbly      bends = a metal that dents instead of breaking
   This is what tells apart minerals that agree on every other test (mica and gypsum, feldspar and olivine). */
CD.BREAKS=[{id:'sheets',n:'Peels into thin sheets',r:'peels apart into thin, bendy sheets'},{id:'blocks',n:'Splits into flat-sided pieces',r:'splits into pieces with flat, smooth sides'},
 {id:'chips',n:'Chips into rough or curved pieces',r:'chips into rough pieces with no flat sides, some curved like broken glass'},{id:'crumbs',n:'Crumbles and flakes',r:'crumbles and flakes into small soft bits'},
 {id:'bends',n:'Dents and bends, but does not break',r:'dents and bends but does not break'}];
{const BR={quartz:'chips',mica:'sheets',gypsum:'crumbs',halite:'blocks',pyrite:'chips',calcite:'blocks',fluorite:'blocks',malachite:'chips',azurite:'chips',willemite:'chips',feldspar:'blocks',
 magnetite:'chips',hematite:'chips',gold:'bends',galena:'blocks',garnet:'chips',corundum:'chips',obsidian:'chips',sulfur:'crumbs',olivine:'chips',diamond:'blocks'};
 Object.keys(CD.MIN).forEach(k=>{CD.MIN[k].br=BR[k]||'chips';});}
window.CAVE_DATA=CD;
})();
