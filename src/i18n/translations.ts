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
    phoneTitle: string;
    phone: string;
  };
  footer: {
    navigationTitle: string;
    contactTitle: string;
  };
  impressum: {
    pageTitle: string;
    content: string;
  };
  privacy: {
    pageTitle: string;
    content: string;
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
    phoneTitle: "Telefon",
    phone: "",
  },
  footer: {
    navigationTitle: "Navigation",
    contactTitle: "Kontakt",
  },
  impressum: {
    pageTitle: "Impressum",
    content: `Angaben gemäß § 5 TMG

Yi Xin Chinesische Sprachschule Heilbronn
Heilbronn, Baden-Württemberg, Deutschland

Kontakt:
E-Mail: info@yixin-heilbronn.de

Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
Yi Xin Chinesische Sprachschule Heilbronn

Haftungsausschluss:
Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.`,
  },
  privacy: {
    pageTitle: "Datenschutzerklärung",
    content: `1. Verantwortlicher (Art. 13 Abs. 1 lit. a DSGVO)
Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
Yi Xin Chinesische Sprachschule Heilbronn
Heilbronn, Baden-Württemberg, Deutschland
E-Mail: info@yixin-heilbronn.de

2. Erhebung und Speicherung personenbezogener Daten
Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert: IP-Adresse des anfragenden Rechners, Datum und Uhrzeit des Zugriffs, Name und URL der abgerufenen Datei, übertragene Datenmenge, Meldung über erfolgreichen Abruf, Browsertyp und -version, Betriebssystem des Nutzers, Referrer URL, Hostname des zugreifenden Rechners.

3. Rechtsgrundlagen der Verarbeitung (Art. 13 Abs. 1 lit. c DSGVO)
Die Verarbeitung Ihrer Daten erfolgt auf folgenden Rechtsgrundlagen:
• Art. 6 Abs. 1 lit. a DSGVO (Einwilligung): Wenn Sie über das Kontaktformular eine Nachricht senden und der Datenschutzerklärung zustimmen.
• Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung): Soweit die Datenverarbeitung zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen erforderlich ist (z. B. Kursanmeldung).
• Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse): Für den Betrieb und die Sicherheit unserer Website, die Auswertung von Zugriffsstatistiken und die Abwehr von Missbrauch.

4. Speicherdauer und Löschung (Art. 13 Abs. 2 lit. a DSGVO)
Ihre personenbezogenen Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist:
• Server-Logfiles: Maximal 30 Tage, danach automatische Löschung.
• Kontaktformular-Anfragen: Aufbewahrung bis zur vollständigen Bearbeitung Ihres Anliegens, anschließend Löschung innerhalb von 6 Monaten, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
• Sitzungs-Cookies (Session): Werden gelöscht, wenn Sie den Browser schließen oder sich abmelden.
• Administratorkonto-Daten: Solange das Konto aktiv ist; nach Deaktivierung innerhalb von 30 Tagen gelöscht.

5. Weitergabe von Daten an Dritte
Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt.

6. Hosting und internationale Datenübermittlung (Art. 13 Abs. 1 lit. f DSGVO)
Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet. Bei dem Zugriff auf unsere Website werden personenbezogene Daten (z. B. IP-Adresse) an Server von Vercel in den USA übermittelt. Die Datenübermittlung in die USA erfolgt auf Grundlage von Standardvertragsklauseln (Standard Contractual Clauses, SCCs) gemäß Art. 46 Abs. 2 lit. c DSGVO, die Vercel mit seinen Kunden abschließt. Weitere Informationen finden Sie in der Datenschutzerklärung von Vercel: https://vercel.com/legal/privacy-policy.

Für den Versand von E-Mails (Kontaktformular, Passwort-Zurücksetzung) nutzen wir den Dienst Resend (Resend Inc., USA). Die Übermittlung erfolgt ebenfalls auf Basis von Standardvertragsklauseln. Weitere Informationen: https://resend.com/legal/privacy-policy.

7. Cookies
Unsere Website verwendet ausschließlich technisch notwendige Cookies:
• Sitzungs-Cookie (yixin-session): Dient der Authentifizierung von Administratoren. HttpOnly, SameSite=Strict, Laufzeit maximal 7 Tage.
• Cookie-Einwilligungs-Cookie (yixin-cookie-consent): Speichert Ihre Cookie-Einstellungen. Laufzeit 1 Jahr.
Es werden keine Tracking-, Marketing- oder Analyse-Cookies verwendet.

8. Kontaktformular
Wenn Sie uns über das Kontaktformular auf unserer Website kontaktieren, werden die von Ihnen eingegebenen Daten (Name, E-Mail-Adresse, Nachricht) zum Zweck der Bearbeitung Ihrer Anfrage gespeichert und per E-Mail an uns weitergeleitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (Ihre Einwilligung durch Aktivierung der Datenschutz-Checkbox). Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.

9. Ihre Rechte als betroffene Person (Art. 13 Abs. 2 lit. b–d DSGVO)
Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:
• Recht auf Auskunft (Art. 15 DSGVO)
• Recht auf Berichtigung (Art. 16 DSGVO)
• Recht auf Löschung (Art. 17 DSGVO)
• Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
• Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
• Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)
• Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)
Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: info@yixin-heilbronn.de

10. Beschwerderecht bei einer Aufsichtsbehörde (Art. 13 Abs. 2 lit. d DSGVO)
Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt.
Die für uns zuständige Aufsichtsbehörde ist:
Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
Lautenschlagerstraße 20, 70173 Stuttgart
Telefon: +49 711 6155 41-0
E-Mail: poststelle@lfdi.bwl.de
Website: https://www.baden-wuerttemberg.datenschutz.de

11. Pflicht zur Bereitstellung personenbezogener Daten
Die Bereitstellung personenbezogener Daten ist weder gesetzlich noch vertraglich vorgeschrieben. Sie sind nicht verpflichtet, personenbezogene Daten bereitzustellen. Allerdings ist die Nutzung des Kontaktformulars ohne Angabe von Name und E-Mail-Adresse nicht möglich.

12. Aktualität und Änderung dieser Datenschutzerklärung
Diese Datenschutzerklärung ist aktuell gültig und hat den Stand April 2025. Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an geänderte Rechtslagen oder bei Änderungen unserer Datenverarbeitungen anzupassen.`,
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
    phoneTitle: "电话",
    phone: "",
  },
  footer: {
    navigationTitle: "导航",
    contactTitle: "联系",
  },
  impressum: {
    pageTitle: "法律声明",
    content: `根据德国《电信媒体法》(TMG) 第5条

海尔布隆一心中文学校
海尔布隆，巴登-符腾堡州，德国

联系方式：
电子邮件：info@yixin-heilbronn.de

根据《州际广播协议》(RStV) 第55条第2款对内容负责：
海尔布隆一心中文学校

免责声明：
我们以最大的谨慎创建了本网站的内容。但我们不能保证内容的准确性、完整性和及时性。`,
  },
  privacy: {
    pageTitle: "隐私政策",
    content: `1. 数据控制者（GDPR 第13条第1款a项）
根据《通用数据保护条例》（DSGVO/GDPR），数据控制者为：
海尔布隆一心中文学校
海尔布隆，巴登-符腾堡州，德国
电子邮件：info@yixin-heilbronn.de

2. 个人数据的收集与存储
当您访问我们的网站时，您设备上的浏览器会自动向我们的服务器发送信息。这些信息会临时存储在所谓的日志文件中。以下信息会在未经您操作的情况下被采集并存储至自动删除：请求设备的IP地址、访问日期和时间、请求的文件名和URL、传输的数据量、访问状态、浏览器类型和版本、用户的操作系统、来源URL、访问设备的主机名。

3. 数据处理的法律依据（GDPR 第13条第1款c项）
我们基于以下法律依据处理您的数据：
• GDPR 第6条第1款a项（同意）：当您通过联系表单发送消息并同意隐私政策时。
• GDPR 第6条第1款b项（合同履行）：当数据处理对履行合同或合同前措施有必要时（如课程注册）。
• GDPR 第6条第1款f项（合法利益）：用于网站运营和安全、访问统计分析及防止滥用。

4. 存储期限和删除（GDPR 第13条第2款a项）
您的个人数据仅在上述目的所需的期限内存储：
• 服务器日志文件：最长30天，之后自动删除。
• 联系表单咨询：保留至您的请求完全处理完毕，此后在6个月内删除（除非存在法定保留义务）。
• 会话Cookie：当您关闭浏览器或注销时删除。
• 管理员账户数据：在账户处于活跃状态期间保留；停用后30天内删除。

5. 向第三方披露数据
除以下列出的目的外，您的个人数据不会被传输给第三方。

6. 托管和国际数据传输（GDPR 第13条第1款f项）
本网站由 Vercel Inc.（440 N Barranca Ave #4133, Covina, CA 91723, USA）托管。访问我们的网站时，个人数据（如IP地址）将被传输到美国的 Vercel 服务器。向美国的数据传输基于 GDPR 第46条第2款c项规定的标准合同条款（SCCs）。更多信息请参阅 Vercel 的隐私政策：https://vercel.com/legal/privacy-policy。

我们使用 Resend 服务（Resend Inc.，美国）发送电子邮件（联系表单、密码重置）。数据传输同样基于标准合同条款。更多信息：https://resend.com/legal/privacy-policy。

7. Cookie
我们的网站仅使用技术上必要的 Cookie：
• 会话Cookie（yixin-session）：用于管理员身份验证。HttpOnly，SameSite=Strict，最长有效期7天。
• Cookie同意Cookie（yixin-cookie-consent）：存储您的 Cookie 设置。有效期1年。
我们不使用跟踪、营销或分析 Cookie。

8. 联系表单
当您通过网站联系表单与我们联系时，您输入的数据（姓名、电子邮件地址、消息）将被存储并通过电子邮件转发给我们，以便处理您的请求。法律依据为 GDPR 第6条第1款a项（您通过勾选隐私声明复选框表示同意）。您可以随时撤回您的同意，撤回将对未来生效。

9. 您作为数据主体的权利（GDPR 第13条第2款b-d项）
您对我们拥有以下关于您个人数据的权利：
• 知情权（GDPR 第15条）
• 更正权（GDPR 第16条）
• 删除权（GDPR 第17条）
• 限制处理权（GDPR 第18条）
• 数据可携权（GDPR 第20条）
• 反对处理权（GDPR 第21条）
• 撤回同意权（GDPR 第7条第3款）
如需行使您的权利，请联系：info@yixin-heilbronn.de

10. 向监管机构投诉的权利（GDPR 第13条第2款d项）
在不影响任何其他行政或司法救济的情况下，如果您认为对您个人数据的处理违反了 GDPR，您有权向监管机构投诉。
我们对应的监管机构为：
巴登-符腾堡州数据保护和信息自由专员
Lautenschlagerstraße 20, 70173 Stuttgart
电话：+49 711 6155 41-0
电子邮件：poststelle@lfdi.bwl.de
网站：https://www.baden-wuerttemberg.datenschutz.de

11. 提供个人数据的义务
提供个人数据既非法定义务也非合同义务。您没有义务提供个人数据。但是，如果不提供姓名和电子邮件地址，则无法使用联系表单。

12. 本隐私政策的时效性和变更
本隐私政策目前有效，更新日期为2025年4月。我们保留在必要时调整本隐私政策的权利，以适应法律变化或数据处理方式的变更。`,
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
    phoneTitle: "Phone",
    phone: "",
  },
  footer: {
    navigationTitle: "Navigation",
    contactTitle: "Contact",
  },
  impressum: {
    pageTitle: "Legal Notice",
    content: `Information pursuant to § 5 TMG (German Telemedia Act)

Yi Xin Chinese Language School Heilbronn
Heilbronn, Baden-Württemberg, Germany

Contact:
Email: info@yixin-heilbronn.de

Responsible for content pursuant to § 55 para. 2 RStV:
Yi Xin Chinese Language School Heilbronn

Disclaimer:
The contents of our pages were created with the greatest care. However, we cannot guarantee the accuracy, completeness, and timeliness of the content.`,
  },
  privacy: {
    pageTitle: "Privacy Policy",
    content: `1. Data Controller (Art. 13(1)(a) GDPR)
The data controller within the meaning of the GDPR is:
Yi Xin Chinese Language School Heilbronn
Heilbronn, Baden-Württemberg, Germany
Email: info@yixin-heilbronn.de

2. Collection and Storage of Personal Data
When you visit our website, the browser on your device automatically sends information to our server. This information is temporarily stored in a log file. The following information is collected without any action on your part and stored until automatic deletion: IP address of the requesting device, date and time of access, name and URL of the requested file, amount of data transferred, notification of successful retrieval, browser type and version, the user's operating system, referrer URL, hostname of the accessing device.

3. Legal Basis for Processing (Art. 13(1)(c) GDPR)
Your data is processed on the following legal bases:
• Art. 6(1)(a) GDPR (Consent): When you send a message via the contact form and agree to the privacy policy.
• Art. 6(1)(b) GDPR (Contract Performance): Where data processing is necessary for the performance of a contract or pre-contractual measures (e.g., course registration).
• Art. 6(1)(f) GDPR (Legitimate Interest): For the operation and security of our website, evaluation of access statistics, and prevention of abuse.

4. Retention Period and Deletion (Art. 13(2)(a) GDPR)
Your personal data is stored only as long as necessary for the stated purposes:
• Server log files: Maximum 30 days, then automatically deleted.
• Contact form inquiries: Retained until your inquiry is fully processed, then deleted within 6 months unless statutory retention obligations apply.
• Session cookies: Deleted when you close your browser or log out.
• Administrator account data: Retained while the account is active; deleted within 30 days after deactivation.

5. Disclosure to Third Parties
Your personal data will not be transmitted to third parties for purposes other than those listed below.

6. Hosting and International Data Transfers (Art. 13(1)(f) GDPR)
This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you access our website, personal data (e.g., IP address) is transmitted to Vercel servers in the USA. Data transfers to the USA are based on Standard Contractual Clauses (SCCs) pursuant to Art. 46(2)(c) GDPR, which Vercel enters into with its customers. For more information, see Vercel's privacy policy: https://vercel.com/legal/privacy-policy.

For sending emails (contact form, password reset), we use the Resend service (Resend Inc., USA). The transfer is also based on Standard Contractual Clauses. More information: https://resend.com/legal/privacy-policy.

7. Cookies
Our website uses only technically necessary cookies:
• Session cookie (yixin-session): Used for administrator authentication. HttpOnly, SameSite=Strict, maximum lifetime of 7 days.
• Cookie consent cookie (yixin-cookie-consent): Stores your cookie settings. Lifetime 1 year.
No tracking, marketing, or analytics cookies are used.

8. Contact Form
When you contact us via the contact form on our website, the data you enter (name, email address, message) is stored and forwarded to us by email to process your inquiry. The legal basis is Art. 6(1)(a) GDPR (your consent by activating the privacy policy checkbox). You may withdraw your consent at any time with effect for the future.

9. Your Rights as a Data Subject (Art. 13(2)(b)–(d) GDPR)
You have the following rights regarding your personal data:
• Right of access (Art. 15 GDPR)
• Right to rectification (Art. 16 GDPR)
• Right to erasure (Art. 17 GDPR)
• Right to restriction of processing (Art. 18 GDPR)
• Right to data portability (Art. 20 GDPR)
• Right to object to processing (Art. 21 GDPR)
• Right to withdraw consent (Art. 7(3) GDPR)
To exercise your rights, please contact: info@yixin-heilbronn.de

10. Right to Lodge a Complaint with a Supervisory Authority (Art. 13(2)(d) GDPR)
Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a supervisory authority if you believe that the processing of your personal data infringes the GDPR.
The supervisory authority responsible for us is:
Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
(State Commissioner for Data Protection and Freedom of Information Baden-Württemberg)
Lautenschlagerstraße 20, 70173 Stuttgart, Germany
Phone: +49 711 6155 41-0
Email: poststelle@lfdi.bwl.de
Website: https://www.baden-wuerttemberg.datenschutz.de

11. Obligation to Provide Personal Data
The provision of personal data is neither legally nor contractually required. You are not obligated to provide personal data. However, the use of the contact form is not possible without providing your name and email address.

12. Updates to this Privacy Policy
This privacy policy is currently valid as of April 2025. We reserve the right to adjust this privacy policy as needed to comply with changed legal requirements or when changes to our data processing practices occur.`,
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
