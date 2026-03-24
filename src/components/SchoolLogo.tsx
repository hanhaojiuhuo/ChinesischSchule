/**
 * SVG badge inspired by the Yi Xin school logo:
 * - circular border with double ring
 * - Chinese name arc at top
 * - open book with red pages
 * - 心 character above the book
 * - 中文 label below the book
 * - German name arc at bottom
 */
export default function SchoolLogo({
  size = 160,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const r = 47; // outer text-path radius
  const rInner = 42; // inner ring radius

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-label="海尔布隆一心中文学校校徽"
      role="img"
    >
      <defs>
        {/* Arc path for top Chinese text */}
        <path
          id="topArc"
          d={`M ${60 - r},60 A ${r},${r} 0 0,1 ${60 + r},60`}
        />
        {/* Arc path for bottom German text */}
        <path
          id="bottomArc"
          d={`M ${60 - r + 4},60 A ${r - 4},${r - 4} 0 0,0 ${60 + r - 4},60`}
        />
      </defs>

      {/* Outer circle */}
      <circle cx="60" cy="60" r="58" fill="white" stroke="#1a1a1a" strokeWidth="2.2" />
      {/* Inner ring */}
      <circle cx="60" cy="60" r={rInner + 5} fill="none" stroke="#1a1a1a" strokeWidth="0.8" />

      {/* Top Chinese text arc */}
      <text fontSize="7.2" fill="#1a1a1a" fontFamily="'Noto Serif SC', serif" fontWeight="700">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          海尔布隆一心中文学校
        </textPath>
      </text>

      {/* Bottom German text arc */}
      <text fontSize="4.6" fill="#1a1a1a" fontFamily="serif" letterSpacing="0.1">
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          Yi Xin Chinesische Sprachschule Heilbronn
        </textPath>
      </text>

      {/* Open book – left page */}
      <path
        d="M 34 68 Q 42 58 60 57 L 60 78 Q 42 79 34 68 Z"
        fill="#c41230"
        stroke="#1a1a1a"
        strokeWidth="0.8"
      />
      {/* Open book – right page */}
      <path
        d="M 86 68 Q 78 58 60 57 L 60 78 Q 78 79 86 68 Z"
        fill="#c41230"
        stroke="#1a1a1a"
        strokeWidth="0.8"
      />
      {/* Book spine */}
      <line x1="60" y1="57" x2="60" y2="78" stroke="#1a1a1a" strokeWidth="1.2" />
      {/* Book base shadow */}
      <path d="M 36 68 Q 60 82 84 68" fill="none" stroke="#9b0e25" strokeWidth="1" />

      {/* 心 character above book */}
      <text
        x="60"
        y="55"
        textAnchor="middle"
        fontSize="13"
        fill="#1a1a1a"
        fontFamily="'Noto Serif SC', serif"
        fontWeight="700"
      >
        心
      </text>
      {/* Small red heart dot on 心 */}
      <circle cx="60" cy="39" r="2.5" fill="#c41230" />

      {/* 中文 label below book */}
      <text
        x="60"
        y="91"
        textAnchor="middle"
        fontSize="9"
        fill="#1a1a1a"
        fontFamily="'Noto Serif SC', serif"
        fontWeight="700"
      >
        中文
      </text>
    </svg>
  );
}
