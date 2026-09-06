const fs = require('fs');
let code = fs.readFileSync('src/components/AddStudentModal.tsx', 'utf8');

const target = `    let finalPhoto = photo;
    if (!finalPhoto) {
      if (gender === 'MALE') {
        finalPhoto = "https://images.unsplash.com/photo-1506869408013-189f783ee855?auto=format&fit=crop&q=80&w=200&h=200"; // Default African boy
      } else if (gender === 'FEMALE') {
        finalPhoto = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200"; // Default African girl
      }
    }`;

const replacement = `    let finalPhoto = photo;
    if (!finalPhoto) {
      const seed = encodeURIComponent(firstName + ' ' + lastName);
      if (gender === 'MALE') {
        finalPhoto = \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${seed}&top=shortHair,shortHairDreads01,shortHairDreads02,shortHairFrizzle,shortHairShaggyMullet,shortHairShortCurly,shortHairShortFlat,shortHairShortRound,shortHairShortWaved,shortHairSides,shortHairTheCaesar,shortHairTheCaesarSidePart&backgroundColor=c0aede\`;
      } else if (gender === 'FEMALE') {
        finalPhoto = \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${seed}&top=longHair,longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairDreads,longHairFrida,longHairFro,longHairFroBand,longHairMiaWallace,longHairNotTooLong,longHairShavedSides,longHairStraight,longHairStraight2,longHairStraightStrand&backgroundColor=ffdfbf\`;
      }
    }`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/AddStudentModal.tsx', code.replace(target, replacement));
  console.log("Photo patched successfully");
} else {
  console.log("Target not found!");
}
