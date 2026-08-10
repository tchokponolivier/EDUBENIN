const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const resetFormFunc = `
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setLevel(LEVELS[0]);
    setGender("MALE");
    setStudentType("NEW");
    setPhoto(null);
    setFatherName("");
    setMotherName("");
    setFatherProfession("");
    setMotherProfession("");
    setFatherContact("");
    setMotherContact("");
    setGuardianName("");
    setGuardianContact("");
    setCanteenOptions([]);
    setDisciplinaryCommitment(false);
    setDisciplinarySignature("");
    setEditingChildId(null);
  };
`;

content = content.replace(
  'const isPrimarySchool = (lv: string) => {',
  resetFormFunc + '\n  const isPrimarySchool = (lv: string) => {'
);
fs.writeFileSync('src/pages/Parent.tsx', content);
