import type { SupportedLanguage } from '../config/app';

export interface TranslationDict {
  greeting: string;
  home: string;
  planner: string;
  quran: string;
  profile: string;
  prayerTimes: string;
  todayTask: string;
  progress: string;
  addTask: string;
  all: string;
  pending: string;
  completed: string;
  remainingTime: string;
  nextPrayer: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunrise: string;
  dayStreak: string;
  yourStats: string;
  tasks: string;
  prayers: string;
  ayahs: string;
  minutes: string;
  milestones: string;
  badges: string;
  purityTitle: string;
  settings: string;
  backupRestore: string;
  exportBackup: string;
  importBackup: string;
  signOut: string;
  signIn: string;
  createAccount: string;
  continueGuest: string;
  forgotPassword: string;
  lastRead: string;
  searchSurah: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  prayed: string;
  markPrayed: string;
  offlineNotice: string;
  fullView: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDict> = {
  bn: {
    greeting: 'আসসালামু আলাইকুম!',
    home: 'হোম',
    planner: 'প্ল্যানার',
    quran: 'কুরআন',
    profile: 'প্রোফাইল',
    prayerTimes: 'নামাজের সময়',
    todayTask: 'আজকের আমল',
    progress: 'অগ্রগতি',
    addTask: 'নতুন আমল যোগ করুন',
    all: 'সব',
    pending: 'বাকি',
    completed: 'সম্পন্ন',
    remainingTime: 'বাকি সময়',
    nextPrayer: 'পরবর্তী নামাজ',
    fajr: 'ফজর',
    dhuhr: 'যোহর',
    asr: 'আসর',
    maghrib: 'মাগরিব',
    isha: 'এশা',
    sunrise: 'সূর্যোদয়',
    dayStreak: 'দিনের স্ট্রিক',
    yourStats: 'আপনার পরিসংখ্যান',
    tasks: 'আমল',
    prayers: 'নামাজ',
    ayahs: 'আয়াত',
    minutes: 'মিনিট',
    milestones: 'মাইলফলক',
    badges: 'অর্জন ও ব্যাজ',
    purityTitle: 'পবিত্রতা ও আত্মনিয়ন্ত্রণ',
    settings: 'সেটিংস',
    backupRestore: 'ব্যাকআপ ও রিস্টোর',
    exportBackup: 'JSON ব্যাকআপ ডাউনলোড',
    importBackup: 'JSON থেকে রিস্টোর করুন',
    signOut: 'সাইন আউট',
    signIn: 'সাইন ইন',
    createAccount: 'অ্যাকাউন্ট তৈরি করুন',
    continueGuest: 'গেস্ট হিসেবে চালিয়ে যান (শুধু এই ডিভাইসে)',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    lastRead: 'সর্বশেষ পঠিত',
    searchSurah: 'সূরার নাম বা নম্বর দিয়ে খুঁজুন...',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    prayed: 'পড়েছি',
    markPrayed: 'পড়লাম',
    offlineNotice: 'অফলাইন মোড · সংরক্ষিত ও গাণিতিক হিসাব ব্যবহৃত হচ্ছে',
    fullView: 'সব সময় দেখুন',
  },
  en: {
    greeting: 'Assalamu Alaikum!',
    home: 'Home',
    planner: 'Planner',
    quran: 'Quran',
    profile: 'Profile',
    prayerTimes: 'Prayer Time',
    todayTask: "Today's Task",
    progress: 'Progress',
    addTask: 'Add New Task',
    all: 'All',
    pending: 'Pending',
    completed: 'Completed',
    remainingTime: 'REMAINING TIME',
    nextPrayer: 'Next Prayer',
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    sunrise: 'Sunrise',
    dayStreak: 'Day Streak',
    yourStats: 'Your Stats',
    tasks: 'Tasks',
    prayers: 'Prayers',
    ayahs: 'Ayahs',
    minutes: 'Minutes',
    milestones: 'MILESTONES',
    badges: 'Achievements & Badges',
    purityTitle: 'Purity & Self-Control (NoFap)',
    settings: 'Settings',
    backupRestore: 'Local Backup & Restore',
    exportBackup: 'Export JSON Backup',
    importBackup: 'Restore from JSON',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    continueGuest: 'Continue as Guest (Device Only)',
    forgotPassword: 'Forgot password?',
    lastRead: 'Last Read',
    searchSurah: 'Search Surah name or number...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    prayed: 'Prayed',
    markPrayed: 'Mark Prayed',
    offlineNotice: 'Offline mode · Using cached & astronomical calculation',
    fullView: 'Full View',
  },
  ar: {
    greeting: 'السلام عليكم!',
    home: 'الرئيسية',
    planner: 'المهام',
    quran: 'القرآن',
    profile: 'الحساب',
    prayerTimes: 'أوقات الصلاة',
    todayTask: 'مهام اليوم',
    progress: 'التقدم',
    addTask: 'مهمة جديدة',
    all: 'الكل',
    pending: 'قيد التنفيذ',
    completed: 'مكتمل',
    remainingTime: 'الوقت المتبقي',
    nextPrayer: 'الصلاة القادمة',
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
    sunrise: 'الشروق',
    dayStreak: 'سلسلة الأيام',
    yourStats: 'إحصائياتك',
    tasks: 'المهام',
    prayers: 'الصلوات',
    ayahs: 'الآيات',
    minutes: 'الدقائق',
    milestones: 'الإنجازات',
    badges: 'الأوسمة والشارات',
    purityTitle: 'العفة وضبط النفس',
    settings: 'الإعدادات',
    backupRestore: 'النسخ الاحتياطي والاستعادة',
    exportBackup: 'تصدير نسخة JSON',
    importBackup: 'استعادة من JSON',
    signOut: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب',
    continueGuest: 'المتابعة كضيف (على الجهاز فقط)',
    forgotPassword: 'هل نسيت كلمة السر؟',
    lastRead: 'آخر قراءة',
    searchSurah: 'ابحث باسم السورة أو رقمها...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    prayed: 'تمت الصلاة',
    markPrayed: 'تأكيد الصلاة',
    offlineNotice: 'وضع عدم الاتصال · استخدام الحساب الفلكي والبيانات المحفوظة',
    fullView: 'عرض الكل',
  },
};
