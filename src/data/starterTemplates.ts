import { ColoringTemplate } from '../types/coloring';

function svgToDataUrl(svgBody: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" fill="none" stroke="#1A1D24" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">${svgBody}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

const dinoSvg = svgToDataUrl(`
  <!-- Sun -->
  <circle cx="830" cy="170" r="68"/>
  <path d="M830 56v26M830 258v26M716 170h26M918 170h26M750 90l18 18M892 232l18 18M750 250l18-18M892 108l18-18"/>
  <!-- Puffy Cloud -->
  <path d="M135 230c-30 0-54-22-54-50 0-25 18-46 43-49 12-36 47-61 88-61 45 0 82 30 91 71 28 3 50 25 50 53 0 28-24 51-54 51H135z"/>
  <!-- Ground Hill -->
  <path d="M0 800c220-45 460-45 710-5 110 18 220 12 314-12"/>
  <!-- Friendly Brontosaurus (closed body + head + tail) -->
  <path d="M290 790v-110c-40-10-76-26-108-48-45-30-74-75-78-115-4-35 18-52 44-32 32 25 65 44 104 53 32-85 118-135 218-135 42 0 80 10 112 27 28-92 38-185 32-265-4-56 32-104 88-104 54 0 96 40 96 90 0 46-34 82-78 86-18 2-32 14-35 32-12 72-20 165-16 250 18 28 28 60 28 96v175h-88V690c-45 14-96 18-145 10v90h-86v-94c-26-4-52-11-76-20v114h-82z"/>
  <!-- Dino Eye & Smile -->
  <circle cx="722" cy="236" r="11" fill="#1A1D24" stroke="none"/>
  <path d="M745 276c-12 14-32 16-48 8"/>
  <!-- Dino Spots -->
  <circle cx="380" cy="495" r="28"/>
  <circle cx="470" cy="520" r="36"/>
  <circle cx="415" cy="595" r="24"/>
  <!-- Fern Leaves -->
  <path d="M140 792c-12-52-50-90-92-106 38-6 78 10 98 44 6-46 32-86 72-104-12 42-4 88 22 122 24-30 62-44 100-36-40 24-66 56-78 80H140z"/>
  <!-- Egg / Pebble -->
  <ellipse cx="835" cy="770" rx="52" ry="64"/>
  <path d="M792 752l24 18 26-22 28 20 14-12"/>
`);

const rocketSvg = svgToDataUrl(`
  <!-- Crescent Moon -->
  <path d="M210 135c-52 14-88 64-82 120 7 62 64 106 126 98 24-3 46-13 63-28-36 8-76-10-95-45-22-39-14-89 18-118-10-12-20-21-30-27z"/>
  <!-- Ringed Planet -->
  <circle cx="805" cy="245" r="78"/>
  <path d="M684 268c-26 16-40 34-34 48 10 24 88 18 174-14 86-32 148-78 138-102-6-14-28-18-58-13"/>
  <!-- Stars -->
  <path d="M165 560l14 34 36 4-28 24 8 36-30-19-30 19 8-36-28-24 36-4z"/>
  <path d="M845 615l12 28 30 3-23 20 7 30-26-16-26 16 7-30-23-20 30-3z"/>
  <circle cx="290" cy="410" r="14"/>
  <circle cx="760" cy="450" r="16"/>
  <!-- Rocket Left Fin -->
  <path d="M402 520c-62 32-96 92-92 162l92-36V520z"/>
  <!-- Rocket Right Fin -->
  <path d="M622 520c62 32 96 92 92 162l-92-36V520z"/>
  <!-- Rocket Exhaust Flame -->
  <path d="M454 704c-18 58-6 128 58 182 64-54 76-124 58-182H454z"/>
  <path d="M484 704c-10 34-2 72 28 104 30-32 38-70 28-104h-56z"/>
  <!-- Rocket Body -->
  <path d="M512 165c-84 82-122 200-110 355l28 184h168l28-184c12-155-26-273-114-355z"/>
  <!-- Nose Cone Divider -->
  <path d="M432 292c48 16 112 16 160 0"/>
  <!-- Porthole Window -->
  <circle cx="512" cy="445" r="64"/>
  <circle cx="512" cy="445" r="40"/>
`);

const whaleSvg = svgToDataUrl(`
  <!-- Clouds -->
  <path d="M140 205c-26 0-48-20-48-44 0-22 16-40 38-43 11-31 41-52 76-52 39 0 72 26 80 62 24 3 43 22 43 46 0 25-21 45-48 45H140z"/>
  <path d="M715 190c-22 0-40-17-40-38 0-19 14-34 32-37 9-26 35-44 65-44 33 0 61 22 68 52 21 3 37 19 37 39 0 21-18 38-41 38H715z"/>
  <!-- Water Spout Droplets -->
  <path d="M474 308c-26-54-72-78-114-64 16 26 48 48 92 64h22z"/>
  <path d="M512 308c26-54 72-78 114-64-16 26-48 48-92 64h-22z"/>
  <path d="M493 210c-14 26-14 48 0 62 14-14 14-36 0-62z"/>
  <!-- Whale Body -->
  <path d="M250 675c-45-38-68-94-62-158 10-108 108-194 240-194 134 0 232 82 246 186 4 28 18 46 42 52 38-40 94-52 134-26-22 30-28 60-14 84 26 16 42 42 36 74-44 12-94-8-126-44-32 42-86 68-156 76-126 14-262-8-340-50z"/>
  <!-- Whale Belly Stripes -->
  <path d="M228 648c74-30 176-28 248 10 38 20 68 38 92 56"/>
  <path d="M310 645v62M382 652v66M454 668v56"/>
  <!-- Whale Eye & Cheek -->
  <circle cx="315" cy="515" r="14" fill="#1A1D24" stroke="none"/>
  <circle cx="364" cy="552" r="22"/>
  <path d="M236 588c24 18 58 20 84 4"/>
  <!-- Ocean Waves -->
  <path d="M0 740c64-32 128-32 192 0s128 32 192 0 128-32 192 0 128 32 192 0 128-32 256 0"/>
  <path d="M0 845c72-28 144-28 216 0s144 28 216 0 144-28 216 0 144 28 216 0 100-20 160-8"/>
  <!-- Little Fish -->
  <path d="M800 885c-36-28-80-28-112 0 32 28 76 28 112 0zm0 0l44-26v52l-44-26z"/>
  <circle cx="724" cy="882" r="7" fill="#1A1D24" stroke="none"/>
`);

const castleSvg = svgToDataUrl(`
  <!-- Clouds -->
  <path d="M125 220c-25 0-46-19-46-42 0-21 15-38 36-41 10-30 39-50 73-50 37 0 68 25 76 59 23 3 41 21 41 44 0 24-20 43-46 43H125z"/>
  <path d="M775 200c-22 0-40-16-40-36 0-18 13-33 31-36 9-25 33-42 62-42 32 0 58 21 65 50 20 3 35 18 35 37 0 20-17 37-39 37H775z"/>
  <!-- Rolling Hill Ground -->
  <path d="M0 840c280-68 744-68 1024 0"/>
  <!-- Left Tower -->
  <rect x="200" y="420" width="144" height="390"/>
  <path d="M180 420l92-155 92 155H180z"/>
  <path d="M272 265v-62l64 22-64 22"/>
  <path d="M244 550v-44c0-16 12-28 28-28s28 12 28 28v44h-56z"/>
  <!-- Right Tower -->
  <rect x="680" y="420" width="144" height="390"/>
  <path d="M660 420l92-155 92 155H660z"/>
  <path d="M752 265v-62l64 22-64 22"/>
  <path d="M724 550v-44c0-16 12-28 28-28s28 12 28 28v44h-56z"/>
  <!-- Center Keep -->
  <path d="M344 510h42v-48h52v48h46v-48h56v48h46v-48h52v48h42v288H344V510z"/>
  <!-- Center Tall Spire -->
  <rect x="444" y="310" width="136" height="152"/>
  <path d="M424 310l88-168 88 168H424z"/>
  <path d="M512 142V76l72 26-72 26"/>
  <circle cx="512" cy="390" r="30"/>
  <!-- Arched Castle Door -->
  <path d="M446 792V670c0-38 29-68 66-68s66 30 66 68v122H446z"/>
  <path d="M512 602v190"/>
`);

const butterflySvg = svgToDataUrl(`
  <!-- Top Left Wing -->
  <path d="M474 470C420 270 210 190 132 288c-64 80-8 232 140 264 68 14 148-12 202-82z"/>
  <circle cx="256" cy="368" r="64"/>
  <circle cx="352" cy="462" r="34"/>
  <!-- Top Right Wing -->
  <path d="M550 470c54-200 264-280 342-182 64 80 8 232-140 264-68 14-148-12-202-82z"/>
  <circle cx="768" cy="368" r="64"/>
  <circle cx="672" cy="462" r="34"/>
  <!-- Bottom Left Wing -->
  <path d="M474 554c-76 10-164 46-214 114-56 76-26 176 58 190 88 15 156-76 164-198l-8-106z"/>
  <circle cx="336" cy="726" r="46"/>
  <!-- Bottom Right Wing -->
  <path d="M550 554c76 10 164 46 214 114 56 76 26 176-58 190-88 15-156-76-164-198l8-106z"/>
  <circle cx="688" cy="726" r="46"/>
  <!-- Butterfly Body & Head -->
  <ellipse cx="512" cy="590" rx="38" ry="165"/>
  <circle cx="512" cy="382" r="48"/>
  <circle cx="496" cy="374" r="7" fill="#1A1D24" stroke="none"/>
  <circle cx="528" cy="374" r="7" fill="#1A1D24" stroke="none"/>
  <path d="M494 398c10 12 26 12 36 0"/>
  <!-- Antennae -->
  <path d="M490 338c-24-56-62-84-94-78"/>
  <circle cx="390" cy="260" r="14"/>
  <path d="M534 338c24-56 62-84 94-78"/>
  <circle cx="634" cy="260" r="14"/>
  <!-- Body Stripes -->
  <path d="M476 516h72M474 576h76M476 636h72M482 694h60"/>
`);

const sailboatSvg = svgToDataUrl(`
  <!-- Sun -->
  <circle cx="195" cy="185" r="66"/>
  <path d="M195 72v26M195 272v26M82 185h26M282 185h26M116 106l18 18M256 246l18 18M116 264l18-18M256 124l18-18"/>
  <!-- Cloud -->
  <path d="M680 220c-26 0-46-19-46-42 0-21 15-38 36-41 10-30 39-50 73-50 37 0 68 25 76 59 23 3 41 21 41 44 0 24-20 43-46 43H680z"/>
  <!-- Seagulls -->
  <path d="M350 240c16-18 36-18 50 0 14-18 34-18 50 0"/>
  <!-- Mast -->
  <rect x="496" y="190" width="24" height="420"/>
  <!-- Top Flag -->
  <path d="M520 194l106 34-106 34V194z"/>
  <!-- Main Sail -->
  <path d="M520 284c145 78 214 188 228 302H520V284z"/>
  <path d="M520 404h184M520 496h216"/>
  <!-- Front Jib Sail -->
  <path d="M496 292c-94 92-154 192-182 294h182V292z"/>
  <!-- Boat Hull -->
  <path d="M220 610h584l-68 148H288L220 610z"/>
  <path d="M250 670h524"/>
  <circle cx="400" cy="714" r="24"/>
  <circle cx="512" cy="714" r="24"/>
  <circle cx="624" cy="714" r="24"/>
  <!-- Waves -->
  <path d="M0 778c70-36 140-36 210 0s140 36 210 0 140-36 210 0 140 36 210 0 100-24 184 0"/>
  <path d="M0 882c80-32 160-32 240 0s160 32 240 0 160-32 240 0 160 32 304 0"/>
`);

const freeDrawSvg = svgToDataUrl(`
  <rect x="48" y="48" width="928" height="928" rx="36" stroke="#D5CFC3" stroke-width="8" stroke-dasharray="20 18"/>
`);

export const STARTER_TEMPLATES: ColoringTemplate[] = [
  {
    id: 'starter-dino',
    title: 'Friendly Bronto',
    category: 'Animals',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: dinoSvg,
    createdAt: 1,
  },
  {
    id: 'starter-rocket',
    title: 'Blast-Off Rocket',
    category: 'Space',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: rocketSvg,
    createdAt: 2,
  },
  {
    id: 'starter-whale',
    title: 'Happy Whale',
    category: 'Ocean',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: whaleSvg,
    createdAt: 3,
  },
  {
    id: 'starter-castle',
    title: 'Storybook Castle',
    category: 'Fantasy',
    difficulty: 'Medium',
    source: 'starter',
    lineArtUrl: castleSvg,
    createdAt: 4,
  },
  {
    id: 'starter-butterfly',
    title: 'Garden Butterfly',
    category: 'Nature',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: butterflySvg,
    createdAt: 5,
  },
  {
    id: 'starter-sailboat',
    title: 'Cozy Sailboat',
    category: 'Vehicles',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: sailboatSvg,
    createdAt: 6,
  },
  {
    id: 'starter-blank',
    title: 'Free Draw Sheet',
    category: 'Blank',
    difficulty: 'Easy',
    source: 'starter',
    lineArtUrl: freeDrawSvg,
    createdAt: 7,
  },
];
