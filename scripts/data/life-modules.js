/**
 * Run Faster Life Modules (pp.65–86).
 *
 * Grant strings use a compact notation, separated by ";":
 *   body +1                       attribute
 *   Etiquette +2                  active skill
 *   G:Electronics +2              skill group
 *   S:Etiquette:Professional      specialization
 *   K:street:[City] +2            knowledge skill (street | academic | professional | interests)
 *   L:English N                   native language
 *   L:[Any] +3                    language skill
 *   Q:SINner (National) -5        quality (signed Karma value, for reference only: included in the module cost)
 * A name in [brackets] is a placeholder the player fills in.
 *
 * Choices (`choices`) cover the "pick one/two" instructions:
 *   attrPick     { count, bonus, exclude[] }                   +bonus to `count` different attributes
 *   skillPick    { options[], count, bonus }                   +bonus to `count` of the listed skills
 *   groupPick    { options[], count, bonus }                   +bonus to `count` of the listed skill groups
 *   languagePick { options[], rating }                         one language from the list
 *   skillPoints  { points, maxEach, hint }                     free points among any active skills
 *   knowledgePoints { points, minCount, minEach, maxEach, type, hint }
 *   variant      { options: [{ label, grants, choices }] }     pick one variant
 * `options` on a module (regions, disciplines, roles, branches…) must be chosen exactly once.
 */

const SIN = "Q:SINner (National) -5";

export const LIFE_MODULE_STAGES = [
  { key: "nationality", label: "Nationality", min: 1, max: 1, note: "All nationality packages cost 15 Karma (Run Faster p.65)." },
  { key: "formative", label: "Formative Years", min: 1, max: 1, note: "Birth to age ten. All packages cost 40 Karma (p.67)." },
  { key: "teen", label: "Teen Years", min: 1, max: 1, note: "To age seventeen. All packages cost 50 Karma (p.70)." },
  { key: "education", label: "Further Education", min: 0, max: 1, note: "Optional. Brings you to 19–21; once you move on to Real Life you cannot come back (p.72)." },
  { key: "realLife", label: "Real Life", min: 0, max: 99, note: "Each module is four years and costs 100 Karma. Several may be taken but never the same one twice (p.76)." }
];

export const LIFE_MODULES = {
  /* ---------------------------------------------------------------- Nationality */
  nationality: [
    {
      id: "ucas", name: "United Canadian and American States (UCAS)", karma: 15, page: 66,
      grants: "L:English N; Computer +1; K:academic:History +1; K:academic:UCAS +1",
      choices: [{ type: "languagePick", label: "Secondary language (1 rank)", rating: 1, options: ["Spanish", "German", "Italian", "French", "Mandarin", "Polish", "Yiddish"] }],
      options: { label: "Region", list: [
        { id: "general", name: "General UCAS", grants: `logic +1; Etiquette +1; K:street:[City] +2; L:[Any] +2; ${SIN}` },
        { id: "canada", name: "Canada", grants: `body +1; Navigation +1; Survival +1; Etiquette +1; ${SIN}` },
        { id: "denver", name: "Denver (UCAS sector)", grants: `intuition +1; K:street:Denver +2; Negotiation +1; Etiquette +1; ${SIN}` },
        { id: "seattle", name: "Seattle", grants: `reaction +1; Perception +1; Intimidation +1; K:street:Seattle +2; ${SIN}` },
        { id: "sinless", name: "SINless", grants: "agility +1; K:street:[City] +1" }
      ] }
    },
    {
      id: "cas", name: "Confederation of American States (CAS)", karma: 15, page: 66,
      grants: "L:English N; Etiquette +1; K:academic:History +1; K:academic:CAS +1",
      choices: [{ type: "languagePick", label: "Secondary language (1 rank)", rating: 1, options: ["Spanish", "German", "Polish", "Yiddish"] }],
      options: { label: "Region", list: [
        { id: "general", name: "General CAS", grants: `charisma +1; Computer +2; ${SIN}` },
        { id: "denver", name: "Denver", grants: `intuition +1; K:street:Denver +2; Negotiation +1; Computer +1; ${SIN}` },
        { id: "sinless", name: "SINless", grants: "body +1; K:street:[City] +1" }
      ] }
    },
    {
      id: "nan", name: "Native American Nations (NAN)", karma: 15, page: 67,
      grants: "Archery +2; K:academic:History +1; K:academic:NAN +1",
      note: "Primary (native) language: choose one of the region's languages. Secondary: one more from the region (or English) at 1 rank.",
      options: { label: "Region", list: [
        { id: "algonkian", name: "Algonkian-Manitou Council", languages: ["Athabaskan", "Anishinaabe", "Iroquoian"], grants: `G:Outdoors +1; Perception +1; Blades +1; Unarmed Combat +1; K:street:[Tribe] +1; ${SIN}` },
        { id: "athabaskan", name: "Athabaskan Council", languages: ["Athabaskan", "Eskimo-Aleut"], grants: `body +1; Survival +1; ${SIN}` },
        { id: "pueblo", name: "Pueblo Corporate Council", languages: ["Uto-Aztecan", "Zuni"], grants: `G:Electronics +1; Etiquette +2; K:professional:Business Practices +1; ${SIN}` },
        { id: "salish", name: "Salish-Shidhe Council", languages: ["Salish", "Siouan", "Or'zet"], grants: `logic +1; Survival +1; ${SIN}` },
        { id: "sioux", name: "Sioux Nation", languages: ["Anishinaabe", "Athabaskan", "Iroquoian", "Siouan"], grants: `G:Outdoors +1; Blades +2; K:street:Sioux Culture +1; ${SIN}` },
        { id: "aleut", name: "Trans-Polar Aleut Nation", languages: ["Eskimo-Aleut"], grants: `Exotic Melee Weapon +2; S:Exotic Melee Weapon:Harpoon; Perception +1; Survival +1; K:professional:Polar Critters +2; ${SIN}` },
        { id: "tsimshian", name: "Tsimshian Nation", languages: ["Athabaskan", "Tlingit", "Tsimshianic", "Siouan"], grants: "strength +1; Blades +1; Q:Allergy (Uncommon, Mild) -5" },
        { id: "denver", name: "Denver", languages: ["English", "Hopi", "Siouan", "Spanish", "Zuni"], grants: `intuition +1; Computer +1; ${SIN}` },
        { id: "vegas", name: "Las Vegas", languages: ["[Native American tribal language]"], grants: `Perception +1; Con +2; Etiquette +1; K:street:Gambling Games +2; ${SIN}` },
        { id: "slc", name: "Salt Lake City", languages: ["English", "Hopi", "Spanish", "Zuni"], grants: `Artisan +1; Computer +1; Etiquette +1; Negotiation +1; Perception +1; K:street:Mormons +2; ${SIN}` }
      ] },
      regionLanguages: true
    },
    {
      id: "tir", name: "Tír Tairngire", karma: 15, page: 67,
      grants: "L:Sperethiel N; L:English +2; Etiquette +1; K:academic:History +1; K:street:Tír Tairngire +1",
      options: { label: "Demographic", list: [
        { id: "elfhuman", name: "Elves/Humans", grants: `charisma +1; Computer +2; ${SIN}` },
        { id: "other", name: "Orks/Trolls/Dwarfs", grants: `Con +2; Disguise +1; Intimidation +1; Sneaking +1; Perception +1; K:street:Counterculture +2; ${SIN}` }
      ] }
    }
  ],

  /* ---------------------------------------------------------------- Formative Years (40) */
  formative: [
    { id: "arcology", name: "Arcology Living", karma: 40, page: 68, grants: "logic +1; charisma +1; Q:SINner (Corporate Limited) -15; G:Electronics +2; Etiquette +2; Perception +1; K:academic:[Corporation] +3" },
    { id: "corpDrone", name: "Corp Drone", karma: 40, page: 68, grants: "logic +1; charisma +1; G:Electronics +2; Etiquette +2; Perception +1; K:academic:[Corporation] +3" },
    { id: "farm", name: "Farm Living", karma: 40, page: 68, grants: "body +1; strength +1; Q:Uneducated -8; Q:Toughness 9; Industrial Mechanic +1; K:professional:Farming +5" },
    { id: "fugitive", name: "Fugitive", karma: 40, page: 68, grants: "reaction +1; willpower +1; intuition +1; Q:Paranoia -7; Q:SINner (Criminal) -10; Q:Bad Rep -7; G:Acting +2; Perception +1; Sneaking +1; K:street:[City] +2" },
    { id: "isolatedRural", name: "Isolated Rural Upbringing", karma: 40, page: 68, grants: "body +1; strength +1; Q:Uncouth -14; Q:Uneducated -8; Q:Toughness 9; Blades +1; G:Outdoors +2; Running +1; Unarmed Combat +1; K:professional:Farming +2" },
    { id: "militaryBrat", name: "Military Brat", karma: 40, page: 69, grants: "strength +1; reaction +1; Q:Uncouth -14; G:Close Combat +2; Negotiation +1; Perception +1; K:professional:Military +3; K:interests:Military History +2" },
    { id: "orphan", name: "Orphan", karma: 40, page: 69, grants: "willpower +1; Computer +1; Perception +2; Sneaking +2; Survival +1; K:street:[City] +3; K:professional:Foster System +3" },
    { id: "richKid", name: "Rich Kid", karma: 40, page: 69, grants: "charisma +1; Q:Trust Fund 10; Q:Prejudiced (Common, Outspoken) -7; Artisan +1; Leadership +2; Computer +2; K:interests:[Any] +3; L:[Any] +3", note: "Prejudiced: Poor." },
    { id: "streetUrchin", name: "Street Urchin", karma: 40, page: 69, grants: "body +1; willpower +1; Q:Paranoia -7; Q:Flashbacks -7; Q:Uneducated -8; Q:Toughness 9; G:Close Combat +2; Perception +1; Running +1; Sneaking +1; K:street:[City] +3" },
    { id: "whiteCollar", name: "White Collar", karma: 40, page: 69, grants: "logic +1; charisma +1; S:Etiquette:Professional; Negotiation +1; K:interests:[Any] +3; L:[Any] +3" }
  ],

  /* ---------------------------------------------------------------- Teen Years (50) */
  teen: [
    { id: "corpEducation", name: "Corporate Education", karma: 50, page: 70, grants: "charisma +1; logic +1; G:Electronics +1; Chemistry +1; Gymnastics +1; K:academic:[Any] +1; K:academic:[Any] +1; K:professional:[Corporation] +2; K:professional:[Job] +2" },
    { id: "farm", name: "Farm Living", karma: 50, page: 70, grants: "body +1; intuition +1; Q:Animal Empathy 3; Industrial Mechanic +2; Longarms +1; Pilot Ground Craft +2; Pistols +1; K:professional:Farming +1; K:interests:[Any] +1" },
    { id: "gangWarfare", name: "Gang Warfare", karma: 50, page: 70, grants: "body +1; reaction +1; willpower +1; Q:Black Market Pipeline 10; Q:Paranoia -7; Q:Uneducated -8; Q:SINner (Criminal) -10; Blades +2; G:Firearms +1; First Aid +1; Leadership +1; Negotiation +1; Perception +1; Running +1; Sneaking +1; Survival +1; K:street:[City] +2" },
    { id: "highSchool", name: "High School", karma: 50, page: 70, grants: "charisma +1; logic +1; G:Athletics +1; Computer +2; Chemistry +1; Software +2; K:academic:[Any] +1; K:academic:[Any] +1; L:[Any] +1; K:street:[Hometown] +1" },
    { id: "homeTutored", name: "Home Tutored", karma: 50, page: 70, grants: "logic +1; willpower +1; Q:Social Stress -8; Chemistry +1; Computer +3; Software +2; K:academic:[Any] +3; K:academic:[Any] +3; L:[Any] +2" },
    { id: "isolatedRural", name: "Isolated Rural Upbringing", karma: 50, page: 71, grants: "body +1; willpower +1; Q:Incompetent (Electronics) -5; Blades +1; First Aid +1; Gymnastics +1; Longarms +1; G:Outdoors +1; Perception +2; Sneaking +1; K:street:Critters +2" },
    {
      id: "magicalEducation", name: "Magical Education", karma: 50, page: 71, awakenedOnly: true,
      grants: "willpower +1; charisma +1; Q:SINner (Corporate Limited) -15; Arcana +2; K:academic:Magical Theory +5; K:academic:[Any] +4; K:academic:[Any] +4; K:academic:[Any] +3; L:[Any] +2",
      note: "You must buy Adept, Aspected Magician, Magician or Mystic Adept separately, and follow this with Further Education then Corporate, or go straight to Corporate.",
      choices: [{ type: "variant", label: "Magical training", options: [
        { label: "Magician", choices: [{ type: "groupPick", label: "+1 to two groups", count: 2, bonus: 1, options: ["Sorcery", "Conjuring", "Enchanting"] }] },
        { label: "Adept", choices: [{ type: "groupPick", label: "+1 to two groups", count: 2, bonus: 1, options: ["Close Combat", "Firearms", "Stealth"] }] },
        { label: "Aspected Magician", choices: [
          { type: "groupPick", label: "+1 to one magical group", count: 1, bonus: 1, options: ["Sorcery", "Conjuring", "Enchanting"] },
          { type: "skillPick", label: "+2 to two skills", count: 2, bonus: 2, options: ["Arcana", "Assensing", "Astral Combat"] }
        ] },
        { label: "Mystic Adept", choices: [{ type: "groupPick", label: "+1 to one group", count: 1, bonus: 1, options: ["Sorcery", "Conjuring", "Enchanting", "Close Combat", "Firearms", "Stealth"] }] }
      ] }]
    },
    { id: "militarySchool", name: "Military School", karma: 50, page: 71, grants: "body +1; charisma +1; Q:Rank 5; Q:Code of Honor -15; Blades +1; G:Electronics +1; G:Firearms +1; First Aid +1; Leadership +1; Unarmed Combat +1; Running +1; Swimming +1; K:professional:Military +3; K:academic:Military History +3; K:academic:[Any] +1; K:professional:Strategy +1", note: "Military Rank (5)." },
    { id: "prepSchool", name: "Preparatory School", karma: 50, page: 71, excludes: ["formative:fugitive", "formative:isolatedRural"], grants: "charisma +1; logic +1; Q:First Impression 11; Chemistry +1; Computer +1; Etiquette +1; K:academic:[Any] +1; K:academic:[Any] +1; L:[Any] +1" },
    { id: "streetKid", name: "Street Kid", karma: 50, page: 72, grants: "body +1; willpower +1; Q:Bad Rep -7; Q:Enemy -10; G:Acting +2; Clubs +1; Etiquette +1; Gymnastics +1; Intimidation +1; First Aid +1; Negotiation +1; Perception +1; Running +1; G:Stealth +1; K:street:[City] +1" }
  ],

  /* ---------------------------------------------------------------- Further Education */
  education: [
    {
      id: "communityCollege", name: "Community College", karma: 55, page: 72, grants: "logic +1; willpower +1",
      options: { label: "Discipline", list: [
        { id: "architecture", name: "Architecture (Science)", grants: "S:Artisan:Drawing; First Aid +1; Industrial Mechanic +1; K:academic:Buildings +5" },
        { id: "business", name: "Business (Science)", grants: "Con +1; Etiquette +1; Negotiation +2; K:academic:Economics +5" },
        { id: "cs", name: "Computer Science (Science)", grants: "Cybercombat +1; G:Electronics +1; Hacking +1; K:academic:Matrix Design +6" },
        { id: "engineering", name: "Engineering (Science)", grants: "Chemistry +1; Hardware +1; Industrial Mechanic +2; K:academic:Engineering +5" },
        { id: "law", name: "Law (Science)", grants: "Etiquette +1; Negotiation +2; Performance +1; K:academic:Law +5" },
        { id: "magic", name: "Magic (Science)", grants: "G:Sorcery +1; K:academic:[Magical Theory or Metaplanes] +5" },
        { id: "math", name: "Mathematics (Science)", grants: "Computer +1; Etiquette +1; Software +2; K:academic:Mathematics +5" },
        { id: "medicine", name: "Medicine (Science)", grants: "G:Biotech +2; Chemistry +1; K:academic:Medicine +6" },
        { id: "natural", name: "Natural Sciences (Science)", grants: "Computer +1; First Aid +1; Software +2; K:academic:[Chemistry/Physics/Biology] +5" },
        { id: "art", name: "Art (Arts)", grants: "Artisan +3; K:academic:Art History +3" },
        { id: "history", name: "History (Arts)", grants: "Computer +1; Software +2; K:academic:[National or World] History +2" },
        { id: "languages", name: "Languages (Arts)", grants: "L:[Any] +6; L:[Any] +5; Negotiation +1; Etiquette +1" },
        { id: "literature", name: "Literature (Arts)", grants: "S:Artisan:Writing; Etiquette +1; K:academic:Literature +5" },
        { id: "metahumanities", name: "Metahumanities (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Ancient Language/Philosophy/Religion", points: 13, minCount: 3, minEach: 3, maxEach: 13, type2: "academic" }] },
        { id: "social", name: "Social Sciences (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Sociology/Psychology/Archaeology/Criminology/Politics", points: 13, minCount: 3, minEach: 3, maxEach: 13, type2: "academic" }] }
      ] }
    },
    {
      id: "ivyLeague", name: "Ivy League University", karma: 80, page: 73,
      grants: "charisma +1; logic +1; willpower +1; Computer +1; Etiquette +1; Perception +1; K:academic:[Any] +4",
      options: { label: "Discipline", list: [
        { id: "architecture", name: "Architecture (Science)", grants: "First Aid +1; Industrial Mechanic +1; K:academic:Buildings +6" },
        { id: "business", name: "Business (Science)", grants: "Etiquette +1; Negotiation +1; K:academic:Economics +6" },
        { id: "cs", name: "Computer Science (Science)", grants: "G:Electronics +1; K:academic:Matrix Design +5" },
        { id: "engineering", name: "Engineering (Science)", grants: "Chemistry +1; Industrial Mechanic +1; K:academic:Engineering +6" },
        { id: "law", name: "Law (Science)", grants: "Negotiation +1; Performance +1; K:academic:Law +6" },
        { id: "magic", name: "Magic (Science)", grants: "G:Sorcery +1; K:academic:[Magical Theory or Metaplanes] +5" },
        { id: "math", name: "Mathematics (Science)", grants: "Etiquette +1; Software +1; K:academic:Mathematics +6" },
        { id: "medicine", name: "Medicine (Science)", grants: "G:Biotech +1; K:academic:Medicine +5" },
        { id: "natural", name: "Natural Sciences (Science)", grants: "Computer +1; Software +1; K:academic:[Chemistry/Physics/Biology] +6" },
        { id: "art", name: "Art (Arts)", grants: "Artisan +2; K:academic:Art History +4" },
        { id: "history", name: "History (Arts)", grants: "Computer +1; Software +1; K:academic:History +6" },
        { id: "languages", name: "Languages (Arts)", grants: "Etiquette +1; L:[Any] +4; L:[Any] +2; L:[Any] +2" },
        { id: "literature", name: "Literature (Arts)", grants: "Artisan +1; S:Artisan:Writing; K:academic:Literature +4" },
        { id: "metahumanities", name: "Metahumanities (Arts)", grants: "", choices: [{ type: "knowledgePoints", label: "Ancient Language/Philosophy/Religion", points: 10, minCount: 3, minEach: 2, maxEach: 10, type2: "academic" }] },
        { id: "social", name: "Social Sciences (Arts)", grants: "", choices: [{ type: "knowledgePoints", label: "Sociology/Psychology/Archaeology/Criminology/Politics", points: 10, minCount: 3, minEach: 1, maxEach: 6, type2: "academic" }] }
      ] }
    },
    {
      id: "militaryAcademy", name: "Military Academy", karma: 115, page: 73,
      grants: "body +1; reaction +1; strength +1; Q:Rank 20; G:Firearms +1; First Aid +1; Leadership +1; Navigation +1; Swimming +1; Unarmed Combat +1; K:academic:Military History +2; K:professional:Military +3",
      note: "Military Rank (20). You must take a Tour of Duty module next.",
      options: { label: "Discipline", list: [
        { id: "architecture", name: "Architecture (Science)", grants: "S:Artisan:Drawing; First Aid +1; Industrial Mechanic +1; K:academic:Buildings +5" },
        { id: "business", name: "Business (Science)", grants: "Con +1; Etiquette +1; Negotiation +2; K:academic:Economics +5" },
        { id: "cs", name: "Computer Science (Science)", grants: "Cybercombat +1; G:Electronics +1; Hacking +1; K:academic:Matrix Design +6" },
        { id: "engineering", name: "Engineering (Science)", grants: "Chemistry +1; Hardware +1; Industrial Mechanic +2; K:academic:Engineering +5" },
        { id: "law", name: "Law (Science)", grants: "Etiquette +1; Negotiation +2; Performance +1; K:academic:Law +5" },
        { id: "magic", name: "Magic (Science)", grants: "G:Sorcery +1; K:academic:[Magical Theory or Metaplanes] +5" },
        { id: "math", name: "Mathematics (Science)", grants: "Computer +1; Etiquette +1; Software +2; K:academic:Mathematics +5" },
        { id: "medicine", name: "Medicine (Science)", grants: "G:Biotech +2; Chemistry +1; K:academic:Medicine +6" },
        { id: "natural", name: "Natural Sciences (Science)", grants: "Computer +1; First Aid +1; Software +2; K:academic:[Chemistry/Physics/Biology] +5" },
        { id: "art", name: "Art (Arts)", grants: "Artisan +3; K:academic:Art History +3" },
        { id: "history", name: "History (Arts)", grants: "Computer +1; Software +2; K:academic:[National or World] History +5" },
        { id: "languages", name: "Languages (Arts)", grants: "Etiquette +1; Negotiation +1; L:[Any] +6; L:[Any] +5" },
        { id: "literature", name: "Literature (Arts)", grants: "Artisan +1; S:Artisan:Writing; Computer +1; K:academic:Literature +5" },
        { id: "metahumanities", name: "Metahumanities (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Ancient Language/Philosophy/Religion", points: 13, minCount: 3, minEach: 1, maxEach: 7, type2: "academic" }] },
        { id: "social", name: "Social Sciences (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Sociology/Psychology/Archaeology/Criminology/Politics", points: 13, minCount: 1, minEach: 1, maxEach: 6, type2: "academic" }] }
      ] }
    },
    {
      id: "stateUniversity", name: "State University/College", karma: 65, page: 75,
      grants: "logic +1; willpower +1; Computer +1; Perception +1; Etiquette +1; K:academic:[Any] +4",
      options: { label: "Discipline", list: [
        { id: "architecture", name: "Architecture (Science)", grants: "Artisan +1; S:Artisan:Drawing; First Aid +1; Industrial Mechanic +1; K:academic:Buildings +5" },
        { id: "business", name: "Business (Science)", grants: "Con +1; Etiquette +1; Negotiation +2; K:academic:Economics +5" },
        { id: "cs", name: "Computer Science (Science)", grants: "Cybercombat +1; G:Electronics +1; Hacking +1; K:academic:Matrix Design +6" },
        { id: "engineering", name: "Engineering (Science)", grants: "Chemistry +1; Hardware +1; Industrial Mechanic +2; K:academic:Engineering +5" },
        { id: "law", name: "Law (Science)", grants: "Etiquette +1; Negotiation +2; Performance +1; K:academic:Law +5" },
        { id: "magic", name: "Magic (Science)", grants: "G:Sorcery +1; K:academic:[Magical Theory or Metaplanes] +5" },
        { id: "math", name: "Mathematics (Science)", grants: "Computer +1; Etiquette +1; Software +2; K:academic:Mathematics +5" },
        { id: "medicine", name: "Medicine (Science)", grants: "G:Biotech +2; Chemistry +1; K:academic:Medicine +6" },
        { id: "natural", name: "Natural Sciences (Science)", grants: "Computer +1; First Aid +1; Software +2; K:academic:[Chemistry/Physics/Biology] +5" },
        { id: "art", name: "Art (Arts)", grants: "Artisan +3; K:academic:Art History +3" },
        { id: "history", name: "History (Arts)", grants: "Computer +1; Software +2; K:academic:[National or World] History +5" },
        { id: "languages", name: "Languages (Arts)", grants: "Etiquette +1; Negotiation +1; L:[Any] +6; L:[Any] +5" },
        { id: "literature", name: "Literature (Arts)", grants: "Artisan +1; S:Artisan:Writing; Computer +1; Instruction +1; K:academic:Literature +5" },
        { id: "metahumanities", name: "Metahumanities (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Ancient Language/Philosophy/Religion", points: 13, minCount: 1, minEach: 1, maxEach: 6, type2: "academic" }] },
        { id: "social", name: "Social Sciences (Arts)", grants: "Computer +1", choices: [{ type: "knowledgePoints", label: "Sociology/Psychology/Archaeology/Criminology/Politics", points: 13, minCount: 1, minEach: 1, maxEach: 6, type2: "academic" }] }
      ] }
    },
    {
      id: "tradeSchool", name: "Trade/Technical School", karma: 40, page: 75,
      grants: "logic +1; Computer +1; Gymnastics +2; Perception +1",
      options: { label: "Vocation", list: [
        { id: "architect", name: "Architect", grants: "First Aid +1; Industrial Mechanic +1; K:professional:Buildings +6" },
        { id: "fashion", name: "Fashion Designer", grants: "Artisan +1; S:Artisan:Fashion; K:professional:Fashion +4" },
        { id: "graphic", name: "Graphic Designer", grants: "Artisan +1; S:Artisan:Drawing; K:professional:Corporate Logos +4" },
        { id: "journalist", name: "Journalist", grants: "Con +1; Etiquette +1; Negotiation +1; K:professional:Politics +4" },
        { id: "lawyer", name: "Lawyer", grants: "Etiquette +1; Negotiation +1; Performance +1; K:professional:Law +4" },
        { id: "mechanic", name: "Mechanic", grants: "First Aid +2; G:Engineering +1; K:professional:Mechanics +3" },
        { id: "media", name: "Media Studies", grants: "Etiquette +1; Negotiation +1; K:professional:Trid Shows +6" },
        { id: "nurse", name: "Nurse", grants: "G:Biotech +1; Etiquette +1; K:professional:Medicine +3" },
        { id: "tradesman", name: "Tradesman", grants: "Automotive Mechanic +1; First Aid +1; Industrial Mechanic +1; K:professional:DIY +4" }
      ] }
    }
  ],

  /* ---------------------------------------------------------------- Real Life (100 each) */
  realLife: [
    { id: "bountyHunter", name: "Bounty Hunter", karma: 100, page: 76, grants: "body +1; willpower +1; intuition +1; G:Athletics +1; G:Close Combat +1; First Aid +1; Intimidation +1; Longarms +1; Perception +1; Pistols +1; Survival +1; Tracking +1; K:street:Lone Star Procedures +3; K:street:Crook Hangouts +3" },
    {
      id: "celebrity", name: "Celebrity", karma: 100, page: 76, grants: "charisma +1; Q:Fame 8; Con +1; Escape Artist +1; K:professional:[Sports/Music/Film] +3",
      choices: [
        { type: "attrPick", label: "+1 to two other attributes", count: 2, bonus: 1, exclude: ["charisma"] },
        { type: "skillPoints", label: "Skills for your field of celebrity (max 3 ranks per skill)", points: 6, maxEach: 3 }
      ]
    },
    { id: "combatCorrespondent", name: "Combat Correspondent", karma: 100, page: 77, grants: "charisma +1; willpower +1; Q:Guts 10; G:Electronics +2; Navigation +1; Negotiation +2; Perception +2; Survival +1; K:professional:Journalism +5; L:[Any] +3; L:[Any] +1" },
    {
      id: "corporate", name: "Corporate", karma: 100, page: 77, grants: "logic +1; intuition +1; Q:SINner (Corporate Limited) -15; Etiquette +1; K:professional:[Corporation] +3",
      options: { label: "Specific job", list: [
        { id: "companyMan", name: "Company Man", grants: "G:Firearms +3; Demolitions +2; Pilot Ground Craft +2; Sneaking +3; Unarmed Combat +2" },
        { id: "decker", name: "Hacker/Decker", grants: "G:Cracking +2; G:Electronics +3; First Aid +2; K:academic:Physics +3; K:professional:Matrix Security Design +6" },
        { id: "guard", name: "Security Guard", grants: "G:Athletics +2; G:Close Combat +2; G:Firearms +2; Perception +2; K:professional:Security Procedures +5; K:professional:Law Enforcement Procedures +4" },
        { id: "rigger", name: "Security Rigger", grants: "G:Electronics +2; Gunnery +3; Perception +2; Pilot Aircraft +2; Pilot Walker +2; Pilot Ground Craft +3; K:professional:Drones +3" },
        { id: "wageMage", name: "Wage Mage", grants: "Arcana +2; Assensing +3; Astral Combat +2; G:Conjuring +2; G:Enchanting +1; G:Sorcery +2; K:professional:Magical Law +1" },
        { id: "wageSlave", name: "Wage Slave", grants: "charisma +1; willpower +1; Con +1; Etiquette +2; Negotiation +2; K:professional:Administration +6" }
      ] }
    },
    { id: "covertOps", name: "Covert Operations", karma: 100, page: 77, grants: "intuition +1; willpower +1; Q:Hawk Eye 3; Q:Poor Link -8; Chemistry +1; Con +1; Escape Artist +1; Etiquette +1; Gymnastics +1; Navigation +1; Perception +1; Pistols +1; Sneaking +2; Survival +1; Unarmed Combat +1; L:[Any] +3; K:academic:[Any] +3; K:professional:Codes +2; K:street:[City] +3" },
    {
      id: "drifter", name: "Drifter", karma: 100, page: 77, grants: "Q:High Pain Tolerance 7; Q:Sense of Direction 3; Con +2; Escape Artist +1; Negotiation +1; Running +1; Sneaking +1; Survival +2; Swimming +1; Unarmed Combat +1; K:street:Grey Market +3; K:street:Black Market +3; K:street:[City] +5; K:street:[Any] +3",
      choices: [{ type: "attrPick", label: "+1 to any two attributes", count: 2, bonus: 1, exclude: [] }]
    },
    { id: "ganger", name: "Ganger", karma: 100, page: 78, grants: "body +1; strength +1; Q:SINner (Criminal) -10; Blades +3; G:Cracking +1; Demolitions +1; G:Electronics +1; Escape Artist +1; G:Firearms +2; Heavy Weapons +1; G:Stealth +1; Survival +1; Perception +1; Pilot Ground Craft +1; Running +1" },
    { id: "governmentAgent", name: "Government Agent", karma: 100, page: 78, grants: `intuition +1; reaction +1; ${SIN}; First Aid +1; G:Influence +2; Pistols +2; Perception +3; Pilot Ground Craft +1; Running +1; Tracking +1; K:professional:Government Procedures +5; K:professional:Law Enforcement Protocols +5; K:professional:National Threats +4` },
    {
      id: "lawEnforcement", name: "Law Enforcement", karma: 100, page: 78, grants: "body +1; reaction +1; willpower +1; Clubs +1; Etiquette +1; First Aid +1; Leadership +1; Perception +1; Pistols +1; K:professional:Police Procedures +3",
      options: { label: "Division", list: [
        { id: "beatCop", name: "Beat Cop", grants: "Intimidation +2; Navigation +1; Pilot Ground Craft +1; K:professional:[City] +5" },
        { id: "cyberCrime", name: "Cyber Crime", grants: "G:Cracking +2; G:Electronics +1; K:professional:Matrix Criminals +5" },
        { id: "cyberDivision", name: "Cyber Division", grants: "Cybertechnology +1; G:Firearms +1; Heavy Weapons +2; Unarmed Combat +1" },
        { id: "mageDivision", name: "Mage Division", grants: "Arcana +1; Assensing +2; G:Sorcery +1; K:professional:Magical Threats +2" },
        { id: "rigger", name: "Rigger", grants: "Automotive Mechanic +1; Gunnery +1; Pilot Aircraft +1; Pilot Walker +1; Pilot Ground Craft +2; K:professional:Drones +1" },
        { id: "swat", name: "SWAT Team", grants: "Armorer +1; G:Firearms +1; Gymnastics +1; Throwing Weapons +2" }
      ] }
    },
    { id: "organizedCrime", name: "Organized Crime", karma: 100, page: 78, grants: "Q:Made Man 5; Q:SINner (Criminal) -10; Blades +1; Con +2; Demolitions +1; Escape Artist +1; Etiquette +1; G:Firearms +3; Forgery +1; Hardware +1; Intimidation +2; Leadership +1; Negotiation +1; Perception +2; Pilot Ground Craft +1; G:Stealth +1; Unarmed Combat +2; K:street:[Syndicate] +4; K:street:[City] +3" },
    { id: "politicalActivist", name: "Political Activist", karma: 100, page: 79, grants: "charisma +1; willpower +1; Q:SINner (Criminal) -10; Con +1; Disguise +1; Etiquette +2; Forgery +2; Instruction +1; Leadership +2; Negotiation +2; Palming +2; Perception +2; Pilot Ground Craft +1; Pistols +2; K:street:[City] +3; K:street:Police Procedures +3; K:interests:[Policlub] +4" },
    {
      id: "postgraduate", name: "Postgraduate Studies", karma: 100, page: 79, requiresStage: "education",
      grants: "logic +1; intuition +1; charisma +1; Instruction +2; K:academic:[Major] +2; K:academic:[Any] +2",
      choices: [{ type: "skillPoints", label: "Skills from your education module (max 4 added to any one skill)", points: 10, maxEach: 4 }]
    },
    {
      id: "privateInvestigator", name: "Private Investigator/Detective", karma: 100, page: 79,
      requiresAny: ["realLife:tourMercenary", "realLife:tourNAN", "realLife:tourTir", "realLife:tourUCAS", "realLife:lawEnforcement", "realLife:covertOps", "realLife:shadowWork", "realLife:governmentAgent", "realLife:corporate"],
      grants: "intuition +1; logic +1; willpower +1; Q:In Debt -5; G:Athletics +1; First Aid +1; G:Influence +1; Perception +2; Pistols +2; Pilot Ground Craft +1; Tracking +1; Unarmed Combat +1; K:street:Law Enforcement Procedures +3; K:street:[City] +2"
    },
    {
      id: "regularJob", name: "Regular Job", karma: 100, page: 79, grants: "charisma +1; logic +1; willpower +1; Leadership +1; Etiquette +1; Negotiation +1; K:professional:[Job] +1; K:professional:[Job] +2; K:interests:[Any] +1",
      choices: [{ type: "skillPoints", label: "Vocational skills relating to your job (max 3 ranks per skill)", points: 6, maxEach: 3 }]
    },
    {
      id: "shadowWork", name: "Shadow Work (Shadowrunner)", karma: 100, page: 80, grants: "body +1",
      options: { label: "Role", list: [
        { id: "face", name: "Face", grants: "charisma +1; Con +1; G:Influence +3; Intimidation +1; Perception +1; Pilot Ground Craft +1; Pistols +1; Q:First Impression 11" },
        { id: "decker", name: "Decker", grants: "G:Cracking +2; G:Electronics +2; Forgery +1; intuition +1; Perception +1; Pistols +1; K:street:Matrix Security Procedures +4; Q:Codeslinger 10" },
        { id: "smuggler", name: "Smuggler", grants: "Electronic Warfare +2; Etiquette +1; Gunnery +2; Navigation +1; Negotiation +1; Perception +2; Pilot Aircraft +2; Pilot Ground Craft +2; Pilot Watercraft +2; Pistols +1; Sneaking +1; K:street:Border Patrol Tactics +6; K:street:Smuggler Safe Houses +6; K:street:Smuggler Routes +6",
          choices: [{ type: "skillPick", label: "Mechanic (+2)", count: 1, bonus: 2, options: ["Aeronautics Mechanic", "Automotive Mechanic", "Nautical Mechanic"] }] },
        { id: "samurai", name: "Street Samurai", grants: "agility +1; reaction +1; G:Athletics +1; Blades +2; G:Firearms +2; Heavy Weapons +1; Negotiation +1; Perception +2; Pilot Ground Craft +1; Sneaking +1; Unarmed Combat +1; K:street:Safe Houses +3; Q:Code of Honor -15" },
        { id: "weaponSpecialist", name: "Weapon Specialist", grants: "Archery +1; Armorer +3; Chemistry +2; G:Close Combat +2; Demolitions +2; G:Firearms +2; Heavy Weapons +1; Negotiation +1; Throwing Weapons +1; K:professional:Blade Design +4; K:professional:Gun Design +5; K:interests:Gun Trivia +3" }
      ] }
    },
    {
      id: "streetMagic", name: "Street Magic", karma: 100, page: 80, awakenedOnly: true, grants: "willpower +1",
      options: { label: "Path", list: [
        { id: "aspected", name: "Aspected Magician", grants: "Arcana +2; Assensing +2; Blades +1; First Aid +1; Survival +1; K:professional:Magical Security +3; K:professional:Small-Group Tactics +2; K:street:Magical Theory +1",
          choices: [{ type: "groupPick", label: "+1 to one magical group", count: 1, bonus: 1, options: ["Enchanting", "Conjuring", "Sorcery"] }] },
        { id: "occult", name: "Occult Investigator", grants: "Arcana +1; Assensing +3; G:Conjuring +1; G:Influence +1; Locksmith +1; Perception +3; Pistols +1; G:Sorcery +2; Tracking +2; K:professional:Forensics +5; K:street:[City] +4" },
        { id: "ecoShaman", name: "Eco-Shaman", grants: "Assensing +2; Astral Combat +2; G:Conjuring +2; Demolitions +1; Etiquette +1; First Aid +1; Forgery +2; Perception +2; Pistols +1; G:Sorcery +2; K:street:Megacorp Law +5; K:street:Magical Theory +3" },
        { id: "streetMage", name: "Street Mage", grants: "Assensing +2; Blades +1; G:Conjuring +2; Palming +1; Perception +1; Sneaking +1; G:Sorcery +2; Survival +1; K:street:Charity Shelters +5; K:street:[City] +4" },
        { id: "streetShaman", name: "Street Shaman", grants: "Assensing +2; Blades +1; G:Conjuring +3; Palming +1; Perception +1; Sneaking +1; G:Sorcery +2; Survival +1; K:street:Charity Shelters +5; K:street:[Sprawl] +4" },
        { id: "talismonger", name: "Talismonger", grants: "Assensing +3; Chemistry +1; G:Enchanting +3; Etiquette +2; First Aid +1; Negotiation +2; Pistols +1; K:professional:Telesma +5; K:professional:Alchemy +5" }
      ] }
    },
    { id: "terrorist", name: "Terrorist", karma: 100, page: 81, grants: "logic +1; willpower +1; Q:SINner (Criminal) -10; Con +1; Demolitions +3; Disguise +2; G:Firearms +2; Leadership +2; Palming +2; Perception +2; Pilot Ground Craft +1; K:street:[City] +3; K:street:Law Enforcement Procedures +2" },
    { id: "thinkTank", name: "Think Tank", karma: 100, page: 81, grants: "willpower +1; logic +2; Q:Analytical Mind 5; Etiquette +2; K:academic:[Any] +6; K:academic:[Any] +3; K:academic:[Any] +3", note: "Three different Academic Knowledge skills must be selected." },
    {
      id: "tourMercenary", name: "Tour of Duty: Mercenary", karma: 100, page: 82,
      requiresAny: ["realLife:tourNAN", "realLife:tourTir", "realLife:tourUCAS", "realLife:corporate", "realLife:shadowWork"],
      grants: "body +1; reaction +1; strength +1; G:Firearms +1; First Aid +1; Navigation +1; K:professional:Foreign Military +3",
      options: { label: "Branch", list: [
        { id: "airForce", name: "Air Force", grants: "Aeronautics Mechanic +1; Armorer +1; Blades +1; Free-Fall +1; Gunnery +1; Pilot Aircraft +2; Survival +1" },
        { id: "army", name: "Army", grants: "Armorer +1; Blades +1; Free-Fall +1; Heavy Weapons +1; Pilot Ground Craft +1; Running +1; Survival +1; Swimming +1; Throwing Weapons +1" },
        { id: "engineering", name: "Engineering Corps", grants: "Armorer +2; Demolitions +1; G:Engineering +1; Gunnery +1; K:professional:Military Vehicles +3" },
        { id: "mage", name: "Mage Corps", grants: "Assensing +2; Arcana +1; G:Conjuring +1; G:Sorcery +1" },
        { id: "medical", name: "Medical Corps", grants: "G:Biotech +2" },
        { id: "navy", name: "Navy", grants: "Armorer +1; Blades +1; Gunnery +1; Perception +1; Pilot Watercraft +2; Survival +1; Swimming +1" },
        { id: "rigger", name: "Rigger Corps", grants: "Gunnery +2; Electronic Warfare +2; Pilot Aircraft +1; Pilot Walker +1; Pilot Ground Craft +1" },
        { id: "specialForces", name: "Special Forces", grants: "Armorer +1; Blades +1; Demolitions +1; Free-Fall +1; Perception +1; Pilot Ground Craft +1; Pilot Watercraft +1; Sneaking +1; Survival +1" }
      ] }
    },
    {
      id: "tourNAN", name: "Tour of Duty: NAN", karma: 100, page: 82,
      grants: `body +1; strength +1; intuition +1; ${SIN}; G:Firearms +1; First Aid +1; Navigation +1; Unarmed Combat +1; K:professional:NAN Military +3`,
      options: { label: "Branch", list: [
        { id: "airForce", name: "Air Force", grants: "Blades +1; Free-Fall +1; Gunnery +1; Pilot Aircraft +2; Survival +1; Tracking +1" },
        { id: "army", name: "Army", grants: "Armorer +1; Blades +1; Heavy Weapons +1; Pilot Ground Craft +1; Survival +2; Throwing Weapons +1" },
        { id: "engineering", name: "Engineering Corps", grants: "Armorer +2; Demolitions +1; G:Engineering +1; Gunnery +1" },
        { id: "mage", name: "Mage Corps", grants: "Assensing +1; Blades +1; G:Conjuring +1; G:Sorcery +1; Survival +1" },
        { id: "medical", name: "Medical Corps", grants: "G:Biotech +2" },
        { id: "navy", name: "Navy", grants: "Armorer +1; Blades +1; Gunnery +1; Pilot Watercraft +1; Survival +2; Swimming +1" },
        { id: "rigger", name: "Rigger Corps", grants: "Archery +1; Blades +1; Electronic Warfare +1; Gunnery +1; Pilot Aircraft +1; Pilot Walker +1; Pilot Ground Craft +1; Survival +1" },
        { id: "specialForces", name: "Special Forces", grants: "Armorer +1; Blades +1; Demolitions +1; Free-Fall +1; Pilot Ground Craft +1; Pilot Watercraft +1; Survival +1; Sneaking +1" }
      ] }
    },
    {
      id: "tourTir", name: "Tour of Duty: Tír Tairngire", karma: 100, page: 83,
      grants: `agility +1; strength +1; ${SIN}; G:Firearms +1; First Aid +1; Navigation +1; Unarmed Combat +1; K:professional:Peacekeepers +4`,
      options: { label: "Branch", list: [
        { id: "airForce", name: "Air Force", grants: "Armorer +1; Blades +1; Free-Fall +1; Gunnery +1; Pilot Aircraft +2; reaction +1; Survival +1" },
        { id: "borderPatrol", name: "Border Patrol", grants: "charisma +1; Armorer +1; Blades +1; Heavy Weapons +1; Perception +1; Pilot Ground Craft +1; Sneaking +1; Swimming +1; Survival +1; Throwing Weapons +1" },
        { id: "engineering", name: "Engineering Corps", grants: "logic +1; Armorer +2; Demolitions +1; G:Engineering +1; Gunnery +1; K:professional:Tir Military Vehicles +3" },
        { id: "ghosts", name: "Ghosts", grants: "willpower +1; Armorer +1; Blades +1; Demolitions +1; Free-Fall +1; Perception +1; Pilot Ground Craft +1; Pilot Watercraft +1; Sneaking +1; Survival +1" },
        { id: "mage", name: "Mage Corps", grants: "logic +1; Arcana +1; Assensing +2; G:Conjuring +1; G:Sorcery +1" },
        { id: "medical", name: "Medical Corps", grants: "logic +1; G:Biotech +2" },
        { id: "navy", name: "Navy", grants: "Blades +1; Gunnery +1; Pilot Watercraft +2; Armorer +1; Perception +1; Survival +1; Swimming +1; body +1" },
        { id: "netwatch", name: "Netwatch", grants: "G:Cracking +1; G:Electronics +1; intuition +1; Perception +1; K:professional:Matrix Threats +6" },
        { id: "peacekeepers", name: "Peace Keepers", grants: "body +1; Armorer +1; Blades +1; Clubs +1; Free-Fall +1; Heavy Weapons +1; Pilot Ground Craft +1; Perception +1; Survival +1; Throwing Weapons +1" },
        { id: "rigger", name: "Rigger Corp", grants: "reaction +1; Electronic Warfare +2; Gunnery +2; Pilot Aircraft +1; Pilot Walker +1; Pilot Ground Craft +1" }
      ] }
    },
    {
      id: "tourUCAS", name: "Tour of Duty: UCAS/CAS/CFS", karma: 100, page: 83,
      grants: `body +1; reaction +1; strength +1; ${SIN}; G:Firearms +1; First Aid +1; Navigation +1; Unarmed Combat +1; K:professional:Military +4`,
      options: { label: "Branch", list: [
        { id: "airForce", name: "Air Force", grants: "Armorer +2; Blades +1; Free-Fall +1; Gunnery +1; Pilot Aircraft +2; Survival +1" },
        { id: "army", name: "Army", grants: "Armorer +1; Blades +1; Free-Fall +1; Heavy Weapons +1; Pilot Ground Craft +1; Survival +1; Throwing Weapons +2" },
        { id: "engineering", name: "Engineering Corps", grants: "Armorer +2; Demolitions +1; G:Engineering +1; Gunnery +1; K:professional:Military Vehicles +5" },
        { id: "mage", name: "Mage Corps", grants: "Assensing +2; G:Conjuring +1; Perception +1; G:Sorcery +1" },
        { id: "medical", name: "Medical Corps", grants: "G:Biotech +2; K:professional:Medicine +3", requiresAny: ["education:tradeSchool:nurse", "education:communityCollege:medicine", "education:ivyLeague:medicine", "education:militaryAcademy:medicine", "education:stateUniversity:medicine"] },
        { id: "navy", name: "Navy", grants: "Armorer +1; Blades +1; Gunnery +2; Pilot Watercraft +2; Survival +1; Swimming +1" },
        { id: "rigger", name: "Rigger Corps", grants: "Electronic Warfare +2; Gunnery +2; Pilot Aircraft +1; Pilot Walker +1; Pilot Ground Craft +1" },
        { id: "specialForces", name: "Special Forces", grants: "Armorer +1; Blades +1; Demolitions +1; Free-Fall +1; Perception +1; Pilot Ground Craft +1; Pilot Watercraft +1; Sneaking +1; Survival +1; Tracking +1" }
      ] }
    }
  ]
};

/** Find a module definition by stage and id. */
export function findModule(stage, id) {
  return (LIFE_MODULES[stage] ?? []).find(m => m.id === id);
}
