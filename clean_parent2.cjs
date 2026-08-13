const fs = require('fs');

let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

// Remove showCommitmentModal state
content = content.replace(/  const \[showCommitmentModal, setShowCommitmentModal\] = useState\(false\);\n/, '');

// Remove renderContract function completely
const renderContractStart = content.indexOf('  const renderContract = () => {');
if (renderContractStart !== -1) {
  const renderContractEnd = content.indexOf('  useEffect(() => {', renderContractStart);
  if (renderContractEnd !== -1) {
     content = content.slice(0, renderContractStart) + content.slice(renderContractEnd);
  }
}

// Remove showCommitmentModal modal UI
const modalStart = content.indexOf('      {showCommitmentModal && (');
if (modalStart !== -1) {
  const nextModalStart = content.indexOf('      {selectedChildForBulletin && settings && (', modalStart);
  if (nextModalStart !== -1) {
     content = content.slice(0, modalStart) + content.slice(nextModalStart);
  }
}

fs.writeFileSync('src/pages/Parent.tsx', content);
