import React from 'react';

interface LHSELogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Official Logo of Lao Holding State Enterprise (LHSE) / ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (ລຮລ)
 * Vector recreation of official emblem:
 * - Red outer circular rim
 * - "ລ ຮ ລ" Lao abbreviation on top
 * - Cyan globe with clean meridian/parallel grid
 * - Green leaf waving horizontally across the globe
 * - Energy/Hydro turbines on left and right
 * - "L H S E" English abbreviation along the bottom arc
 */
export const LHSELogo: React.FC<LHSELogoProps> = ({
  className = '',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="LHSE Logo - Lao Holding State Enterprise"
    >
      {/* Background Circle */}
      <circle cx="150" cy="150" r="148" fill="#FFFFFF" />

      {/* Red Outer Ring */}
      <circle
        cx="150"
        cy="150"
        r="138"
        stroke="#E01E26"
        strokeWidth="11"
        fill="#FFFFFF"
      />

      {/* Top Arc Path for Lao Text "ລ ຮ ລ" */}
      <path
        id="top-arc-text-path"
        d="M 52 146 A 108 108 0 0 1 248 146"
        fill="none"
      />

      {/* Bottom Arc Path for English Text "L H S E" */}
      <path
        id="bottom-arc-text-path"
        d="M 52 154 A 108 108 0 0 0 248 154"
        fill="none"
      />

      {/* Top Lao Characters: ລ  ຮ  ລ */}
      <text
        fill="#0D2E82"
        fontSize="38"
        fontWeight="900"
        fontFamily="'Noto Sans Lao', 'Phetsarath OT', 'Saysettha OT', sans-serif"
        letterSpacing="18"
      >
        <textPath href="#top-arc-text-path" startOffset="50%" textAnchor="middle">
          ລ ຮ ລ
        </textPath>
      </text>

      {/* Bottom Latin Characters: L H S E */}
      <text
        fill="#0D2E82"
        fontSize="34"
        fontWeight="800"
        fontFamily="'Times New Roman', serif"
        letterSpacing="16"
      >
        <textPath href="#bottom-arc-text-path" startOffset="50%" textAnchor="middle">
          L H S E
        </textPath>
      </text>

      {/* Center Globe (Cyan/Blue) */}
      <g id="globe" transform="translate(150, 150)">
        {/* Outer Globe Circle */}
        <circle
          cx="0"
          cy="0"
          r="68"
          stroke="#0092D0"
          strokeWidth="6"
          fill="#FFFFFF"
        />

        {/* Central Vertical Longitude Line */}
        <line
          x1="0"
          y1="-68"
          x2="0"
          y2="68"
          stroke="#0092D0"
          strokeWidth="5"
        />

        {/* Curved Left Longitude Line */}
        <ellipse
          cx="0"
          cy="0"
          rx="35"
          ry="68"
          stroke="#0092D0"
          strokeWidth="5"
          fill="none"
        />

        {/* Latitude Lines */}
        <path
          d="M -60 -28 C -30 -38, 30 -38, 60 -28"
          stroke="#0092D0"
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M -60 28 C -30 38, 30 38, 60 28"
          stroke="#0092D0"
          strokeWidth="5"
          fill="none"
        />

        {/* Green Leaf Waving Across Center */}
        {/* Leaf Body */}
        <path
          d="M -56 12 C -35 -24, 15 -18, 56 -14 C 42 16, -10 32, -56 12 Z"
          fill="#5CA935"
          stroke="#418422"
          strokeWidth="2"
        />
        {/* Leaf Central Vein Line */}
        <path
          d="M -54 12 C -20 -4, 15 2, 54 -13"
          stroke="#38741B"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small diagonal side veins */}
        <path
          d="M -25 3 C -20 -6, -14 -12, -10 -15"
          stroke="#38741B"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 5 0 C 10 -6, 16 -10, 22 -12"
          stroke="#38741B"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -15 8 C -8 13, 0 17, 8 19"
          stroke="#38741B"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Left Turbine / Pinwheel (Hydro / Energy Symbol) */}
      <g transform="translate(68, 150) scale(0.65)">
        <circle cx="0" cy="0" r="14" fill="#0D2E82" />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(0)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(60)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(120)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(180)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(240)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(300)"
        />
        <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
      </g>

      {/* Right Turbine / Pinwheel (Hydro / Energy Symbol) */}
      <g transform="translate(232, 150) scale(0.65)">
        <circle cx="0" cy="0" r="14" fill="#0D2E82" />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(0)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(60)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(120)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(180)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(240)"
        />
        <path
          d="M 0 0 C 10 -20, 26 -16, 20 0 C 14 10, 6 6, 0 0 Z"
          fill="#0D2E82"
          transform="rotate(300)"
        />
        <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
      </g>
    </svg>
  );
};
