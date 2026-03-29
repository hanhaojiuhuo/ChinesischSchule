import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Datenschutzerklärung · 隐私政策 · Privacy Policy",
  description:
    "Datenschutzerklärung der Yi Xin Chinesischen Sprachschule Heilbronn gemäß DSGVO. Privacy Policy of Yi Xin Chinese Language School Heilbronn.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--school-gray)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Page heading */}
          <div className="text-center mb-12">
            <div className="flex justify-center gap-1.5 mb-4">
              <span className="block w-8 h-1 bg-[var(--school-red)] rounded" />
              <span className="block w-3 h-1 bg-[var(--school-red)] rounded opacity-50" />
            </div>
            <h1 className="font-cn text-3xl font-bold text-[var(--school-dark)] mb-2">
              隐私政策
            </h1>
            <p className="text-lg text-gray-500">
              Datenschutzerklärung · Privacy Policy
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[var(--school-border)] p-8 space-y-10 text-sm text-gray-700 leading-relaxed">

            {/* ── 1. Verantwortlicher ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                1. Verantwortlicher
              </h2>
              <p>
                Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              </p>
              <address className="not-italic mt-2 space-y-0.5 text-gray-600">
                <p className="font-semibold">Yi Xin Chinesische Sprachschule Heilbronn</p>
                <p>Heilbronn, Baden-Württemberg, Deutschland</p>
                <p>
                  E-Mail:{" "}
                  <a
                    href="mailto:info@yixin-heilbronn.de"
                    className="text-[var(--school-red)] hover:underline"
                  >
                    info@yixin-heilbronn.de
                  </a>
                </p>
              </address>
            </section>

            {/* ── 2. Erhebung und Speicherung personenbezogener Daten ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                2. Erhebung und Speicherung personenbezogener Daten
              </h2>
              <p>
                Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz
                kommenden Browser automatisch Informationen an den Server unserer Website
                gesendet. Diese Informationen werden temporär in einem sogenannten Logfile
                gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun erfasst und
                bis zur automatisierten Löschung gespeichert:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>IP-Adresse des anfragenden Rechners</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Name und URL der abgerufenen Datei</li>
                <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                <li>verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
              </ul>
              <p className="mt-3">
                Die genannten Daten werden durch uns zu folgenden Zwecken verarbeitet:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>Gewährleistung eines reibungslosen Verbindungsaufbaus der Website</li>
                <li>Gewährleistung einer komfortablen Nutzung unserer Website</li>
                <li>Auswertung der Systemsicherheit und -stabilität</li>
              </ul>
              <p className="mt-3">
                Die Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 S. 1 lit. f
                DSGVO. Unser berechtigtes Interesse folgt aus den oben aufgelisteten Zwecken.
              </p>
            </section>

            {/* ── 3. Weitergabe von Daten ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                3. Weitergabe von Daten an Dritte
              </h2>
              <p>
                Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im
                Folgenden aufgeführten Zwecken findet nicht statt. Wir geben Ihre
                persönlichen Daten nur an Dritte weiter, wenn:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>Sie Ihre nach Art. 6 Abs. 1 S. 1 lit. a DSGVO ausdrückliche Einwilligung dazu erteilt haben,</li>
                <li>die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. f DSGVO zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist,</li>
                <li>für die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. c DSGVO eine gesetzliche Verpflichtung besteht.</li>
              </ul>
            </section>

            {/* ── 4. Hosting ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                4. Hosting
              </h2>
              <p>
                Diese Website wird bei{" "}
                <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723,
                USA, gehostet. Wenn Sie unsere Website besuchen, werden Ihre personenbezogenen
                Daten auf den Servern von Vercel verarbeitet. Vercel ist nach dem
                EU-US Data Privacy Framework zertifiziert. Details entnehmen Sie der{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--school-red)] hover:underline"
                >
                  Datenschutzerklärung von Vercel
                </a>
                .
              </p>
            </section>

            {/* ── 5. Cookies ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                5. Cookies
              </h2>
              <p>
                Unsere Website verwendet Cookies. Bei Cookies handelt es sich um kleine
                Textdateien, die lokal im Zwischenspeicher Ihres Internet-Browsers gespeichert
                werden. Wir setzen ausschließlich technisch notwendige Cookies ein, die für den
                Betrieb der Website erforderlich sind. Diese Cookies werden nicht für
                Tracking- oder Werbezwecke verwendet.
              </p>
            </section>

            {/* ── 6. Kontaktaufnahme ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                6. Kontaktaufnahme per E-Mail
              </h2>
              <p>
                Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen mitgeteilten Daten
                (Ihre E-Mail-Adresse, ggf. Ihr Name und Ihre Telefonnummer) von uns gespeichert,
                um Ihre Fragen zu beantworten. Die in diesem Zusammenhang anfallenden Daten
                löschen wir, nachdem die Speicherung nicht mehr erforderlich ist, oder
                schränken die Verarbeitung ein, falls gesetzliche Aufbewahrungspflichten
                bestehen. Rechtsgrundlage ist Art. 6 Abs. 1 S. 1 lit. f DSGVO.
              </p>
            </section>

            {/* ── 7. Betroffenenrechte ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                7. Ihre Rechte als betroffene Person
              </h2>
              <p>Sie haben das Recht:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>
                  <strong>Auskunft</strong> über Ihre von uns verarbeiteten personenbezogenen
                  Daten zu verlangen (Art. 15 DSGVO),
                </li>
                <li>
                  die <strong>Berichtigung</strong> unrichtiger oder Vervollständigung Ihrer
                  bei uns gespeicherten Daten zu verlangen (Art. 16 DSGVO),
                </li>
                <li>
                  die <strong>Löschung</strong> Ihrer bei uns gespeicherten Daten zu verlangen
                  (Art. 17 DSGVO),
                </li>
                <li>
                  die <strong>Einschränkung</strong> der Verarbeitung Ihrer Daten zu verlangen
                  (Art. 18 DSGVO),
                </li>
                <li>
                  Ihre Daten in einem strukturierten Format zu erhalten
                  (<strong>Datenübertragbarkeit</strong>, Art. 20 DSGVO),
                </li>
                <li>
                  <strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art. 21 DSGVO).
                </li>
              </ul>
              <p className="mt-3">
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
                <a
                  href="mailto:info@yixin-heilbronn.de"
                  className="text-[var(--school-red)] hover:underline"
                >
                  info@yixin-heilbronn.de
                </a>
              </p>
              <p className="mt-3">
                Darüber hinaus haben Sie das Recht, sich bei einer
                Datenschutz-Aufsichtsbehörde zu beschweren. Die für Baden-Württemberg
                zuständige Aufsichtsbehörde ist:{" "}
                <strong>
                  Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit
                  Baden-Württemberg (LfDI)
                </strong>
                ,{" "}
                <a
                  href="https://www.baden-wuerttemberg.datenschutz.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--school-red)] hover:underline"
                >
                  www.baden-wuerttemberg.datenschutz.de
                </a>
                .
              </p>
            </section>

            {/* ── 8. Aktualität ── */}
            <section>
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                8. Aktualität und Änderung dieser Datenschutzerklärung
              </h2>
              <p>
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand März 2025.
                Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher
                bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung
                zu ändern. Die jeweils aktuelle Datenschutzerklärung kann jederzeit auf dieser
                Seite abgerufen werden.
              </p>
            </section>

            {/* ── ZH summary ── */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="font-cn text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                隐私政策摘要（中文）
              </h2>
              <p className="font-cn text-gray-600 leading-loose">
                本网站由一心中文学校（海尔布隆）运营。我们依据欧盟《通用数据保护条例》（DSGVO/GDPR）保护您的个人数据。
                我们仅收集运营本网站所必需的技术数据（如服务器日志），不会将您的个人数据出售或用于广告目的。
                如需行使您的数据权利（访问、更正、删除等），请发送电子邮件至{" "}
                <a
                  href="mailto:info@yixin-heilbronn.de"
                  className="text-[var(--school-red)] hover:underline"
                >
                  info@yixin-heilbronn.de
                </a>
                。
              </p>
            </section>

            {/* ── EN Privacy Policy ── */}
            <section className="border-t border-gray-100 pt-8">
              <h2 className="text-base font-bold text-[var(--school-dark)] mb-3 pb-1 border-b border-gray-100">
                Privacy Policy (English)
              </h2>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">1. Data Controller</h3>
              <p>
                The data controller within the meaning of the General Data Protection Regulation (GDPR) is:
              </p>
              <address className="not-italic mt-2 space-y-0.5 text-gray-600">
                <p className="font-semibold">Yi Xin Chinese Language School Heilbronn</p>
                <p>Heilbronn, Baden-Württemberg, Germany</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:info@yixin-heilbronn.de"
                    className="text-[var(--school-red)] hover:underline"
                  >
                    info@yixin-heilbronn.de
                  </a>
                </p>
              </address>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">2. Collection and Storage of Personal Data</h3>
              <p>
                When you visit our website, the browser on your device automatically sends information to our server.
                This information is temporarily stored in a log file. The following data is collected automatically and
                stored until it is deleted:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>IP address of the requesting device</li>
                <li>Date and time of access</li>
                <li>Name and URL of the retrieved file</li>
                <li>Referring website (referrer URL)</li>
                <li>Browser used and, if applicable, the operating system of your device</li>
              </ul>
              <p className="mt-3">
                This data is processed for the following purposes: ensuring a smooth connection to the website,
                ensuring comfortable use of our website, and evaluating system security and stability.
                The legal basis is Art. 6(1)(f) GDPR (legitimate interest).
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">3. Disclosure to Third Parties</h3>
              <p>
                Your personal data will not be transmitted to third parties for purposes other than those listed below.
                We only share your data if you have given explicit consent (Art. 6(1)(a) GDPR), if disclosure is
                necessary for the assertion of legal claims (Art. 6(1)(f) GDPR), or if there is a legal obligation
                to do so (Art. 6(1)(c) GDPR).
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">4. Hosting</h3>
              <p>
                This website is hosted by{" "}
                <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA.
                When you visit our website, your personal data is processed on Vercel&apos;s servers.
                Vercel is certified under the EU-US Data Privacy Framework. For details, please refer to the{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--school-red)] hover:underline"
                >
                  Vercel Privacy Policy
                </a>
                .
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">5. Cookies</h3>
              <p>
                Our website uses cookies. Cookies are small text files stored locally in your browser&apos;s cache.
                We only use technically necessary cookies required for the operation of the website.
                These cookies are not used for tracking or advertising purposes.
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">6. Contact via Email</h3>
              <p>
                If you contact us by email, the data you provide (your email address, name, and phone number if
                applicable) will be stored to answer your questions. We delete this data once storage is no longer
                necessary, or restrict processing if statutory retention obligations apply.
                The legal basis is Art. 6(1)(f) GDPR.
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">7. Your Rights as a Data Subject</h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li><strong>Access</strong> information about your personal data processed by us (Art. 15 GDPR),</li>
                <li>Request <strong>rectification</strong> of inaccurate or incomplete data (Art. 16 GDPR),</li>
                <li>Request <strong>erasure</strong> of your stored data (Art. 17 GDPR),</li>
                <li>Request <strong>restriction</strong> of processing (Art. 18 GDPR),</li>
                <li>Receive your data in a structured format (<strong>data portability</strong>, Art. 20 GDPR),</li>
                <li><strong>Object</strong> to processing (Art. 21 GDPR).</li>
              </ul>
              <p className="mt-3">
                To exercise your rights, please contact:{" "}
                <a
                  href="mailto:info@yixin-heilbronn.de"
                  className="text-[var(--school-red)] hover:underline"
                >
                  info@yixin-heilbronn.de
                </a>
              </p>
              <p className="mt-3">
                You also have the right to lodge a complaint with a data protection supervisory authority.
                The competent authority for Baden-Württemberg is:{" "}
                <strong>
                  Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit
                  Baden-Württemberg (LfDI)
                </strong>
                ,{" "}
                <a
                  href="https://www.baden-wuerttemberg.datenschutz.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--school-red)] hover:underline"
                >
                  www.baden-wuerttemberg.datenschutz.de
                </a>
                .
              </p>

              <h3 className="text-sm font-semibold text-[var(--school-dark)] mt-4 mb-2">8. Updates to this Privacy Policy</h3>
              <p>
                This privacy policy is currently valid as of March 2025. Due to the further development of our
                website or changes in legal or regulatory requirements, it may become necessary to amend this
                privacy policy. The current version can always be accessed on this page.
              </p>
            </section>

          </div>

          <p className="text-center mt-8 text-xs text-gray-400">
            <Link href="/" className="hover:text-[var(--school-red)] underline transition-colors">
              ← 返回网站 / Zurück zur Website / Back to site
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
