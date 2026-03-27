export type Language = "de" | "zh" | "en";

export interface CourseItem {
  level: string;
  levelLabel: string;
  ages: string;
  time?: string;
  desc: string;
}

export interface NewsTextBlock {
  type: "text";
  content: string;
}

export interface NewsImageBlock {
  type: "image";
  url: string;
  caption?: string;
}

export type NewsBodyBlock = NewsTextBlock | NewsImageBlock;

export interface NewsItem {
  date: string;
  title: string;
  body: string;
  /** Flexible body blocks (text + images in any order). When present, `body` is ignored for rendering. */
  bodyBlocks?: NewsBodyBlock[];
  /** @deprecated Use bodyBlocks instead */
  imageUrl?: string;
  /** @deprecated Use bodyBlocks instead */
  imageCaption?: string;
  /** @deprecated Use bodyBlocks instead */
  imagePosition?: "before" | "after";
}

export interface SiteContent {
  schoolName: string;
  schoolNameShort: string;
  schoolSubtitle: string;
  nav: {
    home: string;
    about: string;
    courses: string;
    news: string;
    contact: string;
  };
  hero: {
    tagline: string;
    tagline2: string;
    discoverCourses: string;
    contactUs: string;
  };
  about: {
    sectionTitle: string;
    desc1: string;
    desc2: string;
    yearsLabel: string;
    studentsLabel: string;
    teachersLabel: string;
    coursesLabel: string;
    years: string;
    students: string;
    teachers: string;
    coursesCount: string;
  };
  courses: {
    sectionTitle: string;
    items: CourseItem[];
  };
  news: {
    sectionTitle: string;
    items: NewsItem[];
  };
  contact: {
    sectionTitle: string;
    addressTitle: string;
    addressLines: string[];
    emailTitle: string;
    email: string;
  };
  footer: {
    navigationTitle: string;
    contactTitle: string;
  };
}

const de: SiteContent = {
  schoolName: "Yi Xin Chinesische Sprachschule Heilbronn",
  schoolNameShort: "Yi Xin Sprachschule Heilbronn",
  schoolSubtitle: "海尔布隆一心中文学校",
  nav: {
    home: "Home",
    about: "Über uns",
    courses: "Kurse",
    news: "Aktuelles",
    contact: "Kontakt",
  },
  hero: {
    tagline: "Lernen Sie Chinesisch mit Herz und Leidenschaft — in Heilbronn.",
    tagline2: "用心学习，传承文化。",
    discoverCourses: "Kurse entdecken",
    contactUs: "Kontakt aufnehmen",
  },
  about: {
    sectionTitle: "Über uns",
    desc1: "Die Yi Xin Chinesische Sprachschule Heilbronn wurde gegründet, um chinesische Sprache und Kultur in der Region zu fördern und chinesisch-deutschen Familien eine qualitativ hochwertige Bildung in der Muttersprache zu bieten.",
    desc2: "海尔布隆一心中文学校致力于弘扬中华语言文化，为当地华人家庭提供高质量的中文教育。学校以\u201c一心\u201d为名，寓意全心全意投入教育事业。",
    yearsLabel: "Jahre Erfahrung",
    studentsLabel: "Schüler",
    teachersLabel: "Lehrkräfte",
    coursesLabel: "Kursgruppen",
    years: "10+",
    students: "200+",
    teachers: "15+",
    coursesCount: "4",
  },
  courses: {
    sectionTitle: "Kursangebot",
    items: [
      {
        level: "初级班",
        levelLabel: "Anfänger",
        ages: "6–10 Jahre",
        time: "Sa. 09:00–10:30 Uhr",
        desc: "Pinyin, Grundvokabular und einfache Sätze",
      },
      {
        level: "中级班",
        levelLabel: "Mittelstufe",
        ages: "10–14 Jahre",
        time: "Sa. 09:00–11:00 Uhr",
        desc: "HSK 2–3, Lesen und Schreiben",
      },
      {
        level: "高级班",
        levelLabel: "Fortgeschrittene",
        ages: "14+ Jahre",
        time: "Sa. 09:00–11:30 Uhr",
        desc: "HSK 4–6, Konversation und Kultur",
      },
      {
        level: "成人班",
        levelLabel: "Erwachsene",
        ages: "18+ Jahre",
        time: "Sa. 10:00–13:00 Uhr",
        desc: "Alltagskommunikation, Reise & Geschäft",
      },
    ],
  },
  news: {
    sectionTitle: "Aktuelles",
    items: [
      {
        date: "2025-09",
        title: "Neues Schuljahr 2025/26 beginnt",
        body: "Die Anmeldung für das neue Schuljahr ist ab sofort möglich.",
      },
      {
        date: "2025-02",
        title: "Laternenfest-Feier",
        body: "Gemeinsam haben wir das chinesische Laternenfest gefeiert.",
      },
      {
        date: "2024-12",
        title: "Jahresabschlussfeier",
        body: "Unsere Schüler haben ihr Können beim Jahresabschluss eindrucksvoll bewiesen.",
      },
    ],
  },
  contact: {
    sectionTitle: "Kontakt",
    addressTitle: "Adresse",
    addressLines: ["Heilbronn", "Baden-Württemberg, Deutschland"],
    emailTitle: "E-Mail",
    email: "info@yixin-heilbronn.de",
  },
  footer: {
    navigationTitle: "Navigation",
    contactTitle: "Kontakt",
  },
};

const zh: SiteContent = {
  schoolName: "海尔布隆一心中文学校",
  schoolNameShort: "一心中文学校",
  schoolSubtitle: "Yi Xin Chinesische Sprachschule Heilbronn",
  nav: {
    home: "首页",
    about: "关于我们",
    courses: "课程设置",
    news: "学校新闻",
    contact: "联系我们",
  },
  hero: {
    tagline: "用心学习，传承文化。",
    tagline2: "在海尔布隆学习中文，感受中华文化。",
    discoverCourses: "查看课程",
    contactUs: "联系我们",
  },
  about: {
    sectionTitle: "关于我们",
    desc1: "海尔布隆一心中文学校致力于弘扬中华语言文化，为当地华人家庭提供高质量的中文教育。",
    desc2: "学校以\u201c一心\u201d为名，寓意全心全意投入教育事业，为海尔布隆地区的中德家庭提供优质的母语教育。",
    yearsLabel: "年办学经验",
    studentsLabel: "在校学生",
    teachersLabel: "专业教师",
    coursesLabel: "课程班级",
    years: "10+",
    students: "200+",
    teachers: "15+",
    coursesCount: "4",
  },
  courses: {
    sectionTitle: "课程设置",
    items: [
      {
        level: "初级班",
        levelLabel: "初级",
        ages: "6–10岁",
        time: "周六 09:00–10:30",
        desc: "拼音、基础词汇、简单句子",
      },
      {
        level: "中级班",
        levelLabel: "中级",
        ages: "10–14岁",
        time: "周六 09:00–11:00",
        desc: "HSK 2–3，读写能力进阶",
      },
      {
        level: "高级班",
        levelLabel: "高级",
        ages: "14岁以上",
        time: "周六 09:00–11:30",
        desc: "HSK 4–6，高阶汉语、文化与文学",
      },
      {
        level: "成人班",
        levelLabel: "成人",
        ages: "18岁以上",
        time: "周六 10:00–13:00",
        desc: "日常交流、旅行与商务",
      },
    ],
  },
  news: {
    sectionTitle: "学校新闻",
    items: [
      {
        date: "2025-09",
        title: "2025/26学年开始招生",
        body: "新学年报名现已开放，欢迎各位家长为孩子报名。",
      },
      {
        date: "2025-02",
        title: "元宵节庆典",
        body: "我们共同庆祝了中国元宵节，同学们表演了精彩节目。",
      },
      {
        date: "2024-12",
        title: "年终表彰典礼",
        body: "学生们在年终典礼上展示了他们的才能，表现优异。",
      },
    ],
  },
  contact: {
    sectionTitle: "联系我们",
    addressTitle: "地址",
    addressLines: ["海尔布隆", "巴登-符腾堡州，德国"],
    emailTitle: "邮箱",
    email: "info@yixin-heilbronn.de",
  },
  footer: {
    navigationTitle: "导航",
    contactTitle: "联系",
  },
};

const en: SiteContent = {
  schoolName: "Yi Xin Chinese Language School Heilbronn",
  schoolNameShort: "Yi Xin Chinese School Heilbronn",
  schoolSubtitle: "海尔布隆一心中文学校",
  nav: {
    home: "Home",
    about: "About",
    courses: "Courses",
    news: "News",
    contact: "Contact",
  },
  hero: {
    tagline: "Learn Chinese with heart and passion — in Heilbronn.",
    tagline2: "用心学习，传承文化。",
    discoverCourses: "Discover Courses",
    contactUs: "Contact Us",
  },
  about: {
    sectionTitle: "About Us",
    desc1: "Yi Xin Chinese Language School Heilbronn was founded to promote Chinese language and culture in the region and to provide high-quality mother-tongue education for Chinese-German families.",
    desc2: "海尔布隆一心中文学校致力于弘扬中华语言文化，为当地华人家庭提供高质量的中文教育。",
    yearsLabel: "Years of Experience",
    studentsLabel: "Students",
    teachersLabel: "Teachers",
    coursesLabel: "Course Groups",
    years: "10+",
    students: "200+",
    teachers: "15+",
    coursesCount: "4",
  },
  courses: {
    sectionTitle: "Courses",
    items: [
      {
        level: "初级班",
        levelLabel: "Beginner",
        ages: "Ages 6–10",
        time: "Sat. 09:00–10:30",
        desc: "Pinyin, basic vocabulary, simple sentences",
      },
      {
        level: "中级班",
        levelLabel: "Intermediate",
        ages: "Ages 10–14",
        time: "Sat. 09:00–11:00",
        desc: "HSK 2–3, reading and writing skills",
      },
      {
        level: "高级班",
        levelLabel: "Advanced",
        ages: "Ages 14+",
        time: "Sat. 09:00–11:30",
        desc: "HSK 4–6, conversation and culture",
      },
      {
        level: "成人班",
        levelLabel: "Adult",
        ages: "Ages 18+",
        time: "Sat. 10:00–13:00",
        desc: "Daily communication, travel & business",
      },
    ],
  },
  news: {
    sectionTitle: "News",
    items: [
      {
        date: "2025-09",
        title: "New School Year 2025/26 Begins",
        body: "Registration for the new school year is now open.",
      },
      {
        date: "2025-02",
        title: "Lantern Festival Celebration",
        body: "We celebrated the Chinese Lantern Festival together with wonderful student performances.",
      },
      {
        date: "2024-12",
        title: "Year-End Award Ceremony",
        body: "Our students demonstrated their talents impressively at the year-end ceremony.",
      },
    ],
  },
  contact: {
    sectionTitle: "Contact",
    addressTitle: "Address",
    addressLines: ["Heilbronn", "Baden-Württemberg, Germany"],
    emailTitle: "Email",
    email: "info@yixin-heilbronn.de",
  },
  footer: {
    navigationTitle: "Navigation",
    contactTitle: "Contact",
  },
};

export const defaultTranslations: Record<Language, SiteContent> = { de, zh, en };

/** Convert a NewsItem (possibly using legacy single-image fields) into bodyBlocks. */
export function getNewsBodyBlocks(item: NewsItem): NewsBodyBlock[] {
  if (item.bodyBlocks && item.bodyBlocks.length > 0) return item.bodyBlocks;
  const blocks: NewsBodyBlock[] = [];
  if (item.imageUrl && item.imagePosition !== "after") {
    blocks.push({ type: "image", url: item.imageUrl, caption: item.imageCaption });
  }
  if (item.body) {
    blocks.push({ type: "text", content: item.body });
  }
  if (item.imageUrl && item.imagePosition === "after") {
    blocks.push({ type: "image", url: item.imageUrl, caption: item.imageCaption });
  }
  return blocks;
}
