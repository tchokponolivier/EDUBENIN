import fs from 'fs';

let content = fs.readFileSync('src/lib/db.ts', 'utf-8');

// Stop seeding schoolSettings
content = content.replace(
`getSchoolSettings(): SchoolSettings {
    const settings = this.get<SchoolSettings>("schoolSettings");
    if (settings.length === 0) {
      const defaultSettings: SchoolSettings = {
        id: "school_1",
        name: "Lycée Béhanzin",
        address: "Zounmè, Porto-Novo, Bénin",
        contact: "+229 22 22 22 22 | lyceebehanzin@edu.bj",
        motto: "Travail - Rigueur - Succès",
        logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&h=128&fit=crop",
        academicYear: "2025 - 2026"
      };
      this.set("schoolSettings", [defaultSettings]);
      return defaultSettings;
    }
    return settings[0];
  }`,
`getSchoolSettings(): SchoolSettings {
    const settings = this.get<SchoolSettings>("schoolSettings");
    return settings[0] || {} as SchoolSettings;
  }`
);

// Stop seeding schools
content = content.replace(
`getSchools(): School[] {
    const schools = this.get<School>("schools");
    if (schools.length === 0) {
      // Seed data
      const defaultSchool: School = {
        id: "school_1",
        name: "Lycée Béhanzin",
        locality: "Porto-Novo",
        contacts: "22 22 22 22",
        createdAt: Date.now(),
        mobileMoneyNumbers: { moov: "94 00 00 00", mtn: "97 00 00 00" }
      };
      this.set("schools", [defaultSchool]);
      return [defaultSchool];
    }
    return schools;
  }`,
`getSchools(): School[] {
    return this.get<School>("schools");
  }`
);

fs.writeFileSync('src/lib/db.ts', content);
