// وحدة تهيئة وتعريف المواد الدراسية والمسميات (Subjects Configuration & Aliases)
// الميزانية القصوى: 140 سطر

const SUBJECTS_INFO = {
  islamic: 'التربية الإسلامية',
  reading: 'القراءة',
  arabic: 'اللغة العربية',
  english: 'اللغة الإنكليزية',
  math: 'الرياضيات',
  science: 'العلوم',
  ethics: 'الأخلاقية',
  social: 'الاجتماعيات',
  computer: 'الحاسوب',
  physics: 'الفيزياء',
  chemistry: 'الكيمياء',
  biology: 'الأحياء',
  art: 'التربية الفنية',
  sport: 'التربية الرياضية'
};

const SUBJECT_ALIASES = {
  'التربية الإسلامية': 'islamic',
  'الإسلامية': 'islamic',
  'إسلامية': 'islamic',
  'القراءة': 'reading',
  'قراءة': 'reading',
  'اللغة العربية': 'arabic',
  'العربية': 'arabic',
  'عربي': 'arabic',
  'اللغة الإنكليزية': 'english',
  'الإنكليزية': 'english',
  'الانكليزية': 'english',
  'إنكليزي': 'english',
  'الرياضيات': 'math',
  'رياضيات': 'math',
  'العلوم': 'science',
  'علوم': 'science',
  'الأخلاقية': 'ethics',
  'الاخلاقية': 'ethics',
  'التربية الأخلاقية': 'ethics',
  'أخلاقية': 'ethics',
  'اخلاقية': 'ethics',
  'الاجتماعيات': 'social',
  'اجتماعيات': 'social',
  'الحاسوب': 'computer',
  'حاسوب': 'computer',
  'الفيزياء': 'physics',
  'الكيمياء': 'chemistry',
  'الأحياء': 'biology',
  'التربية الفنية': 'art',
  'الفنية': 'art',
  'فنية': 'art',
  'التربية الرياضية': 'sport',
  'الرياضة': 'sport',
  'رياضة': 'sport'
};

function getSubjectsForGrade(level = 'primary', gradeVal = '1') {
  const lvl = level || 'primary';
  const gStr = String(gradeVal || '1');

  if (lvl === 'primary') {
    // الصفوف 1 و 2 و 3
    if (['1', '2', '3'].includes(gStr)) {
      return [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'reading', name: 'القراءة' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' },
        { id: 'english', name: 'اللغة الإنكليزية' },
        { id: 'ethics', name: 'الأخلاقية' },
        { id: 'sport', name: 'التربية الرياضية' },
        { id: 'art', name: 'التربية الفنية' }
      ];
    }
    // الصفوف 4 و 5 و 6
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'science', name: 'العلوم' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'social', name: 'الاجتماعيات' },
      { id: 'sport', name: 'التربية الرياضية' },
      { id: 'art', name: 'التربية الفنية' }
    ];
  }

  if (lvl === 'middle') {
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'science', name: 'العلوم' },
      { id: 'social', name: 'الاجتماعيات' },
      { id: 'computer', name: 'الحاسوب' },
      { id: 'sport', name: 'التربية الرياضية' },
      { id: 'art', name: 'التربية الفنية' }
    ];
  }

  if (lvl === 'high') {
    return [
      { id: 'islamic', name: 'التربية الإسلامية' },
      { id: 'arabic', name: 'اللغة العربية' },
      { id: 'english', name: 'اللغة الإنكليزية' },
      { id: 'math', name: 'الرياضيات' },
      { id: 'physics', name: 'الفيزياء' },
      { id: 'chemistry', name: 'الكيمياء' },
      { id: 'biology', name: 'الأحياء' }
    ];
  }

  return SUBJECTS_BY_LEVEL[lvl] || [];
}

const SUBJECTS_BY_LEVEL = {
  primary: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'reading', name: 'القراءة (1-3)' },
    { id: 'arabic', name: 'اللغة العربية (4-6)' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'ethics', name: 'الأخلاقية (1-3)' },
    { id: 'social', name: 'الاجتماعيات (4-6)' },
    { id: 'sport', name: 'التربية الرياضية' },
    { id: 'art', name: 'التربية الفنية' }
  ],
  middle: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم' },
    { id: 'social', name: 'الاجتماعيات' },
    { id: 'computer', name: 'الحاسوب' },
    { id: 'sport', name: 'التربية الرياضية' },
    { id: 'art', name: 'التربية الفنية' }
  ],
  high: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الإنكليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'physics', name: 'الفيزياء' },
    { id: 'chemistry', name: 'الكيمياء' },
    { id: 'biology', name: 'الأحياء' }
  ]
};

function normalizeSubjectId(subId) {
  if (!subId) return 'islamic';
  if (SUBJECTS_INFO[subId]) return subId;
  if (SUBJECT_ALIASES[subId]) return SUBJECT_ALIASES[subId];
  return subId;
}

window.SUBJECTS_INFO = SUBJECTS_INFO;
window.SUBJECT_ALIASES = SUBJECT_ALIASES;
window.SUBJECTS_BY_LEVEL = SUBJECTS_BY_LEVEL;
window.getSubjectsForGrade = getSubjectsForGrade;
window.normalizeSubjectId = normalizeSubjectId;
