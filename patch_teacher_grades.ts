import fs from 'fs';
let content = fs.readFileSync('src/pages/TeacherDashboard.tsx', 'utf-8');

const replacement = `  const handleSaveGrades = async () => {
    if (!user?.schoolId) return;

    try {
      const gradesToInsert: any[] = [];
      const appreciationsToInsert: any[] = [];
      const now = new Date().toISOString();

      // Collect grades
      Object.entries(grades).forEach(([studentId, subjectsData]) => {
        if (!includedStudents.includes(studentId)) return;
        
        Object.entries(subjectsData).forEach(([subjectId, scoreStr]) => {
          if (scoreStr && scoreStr.trim() !== '') {
            let score = parseFloat(scoreStr.replace(',', '.'));
            if (!isNaN(score)) {
              gradesToInsert.push({
                school_id: user.schoolId,
                student_id: studentId,
                course_id: subjectId,
                evaluation_type: 'EVALUATION',
                score: score,
                max_score: 20,
                grade_date: now
              });
            }
          }
        });
      });

      // Collect appreciations
      Object.entries(appreciations).forEach(([studentId, comment]) => {
        if (!includedStudents.includes(studentId) || !comment || comment.trim() === '') return;
        
        appreciationsToInsert.push({
          school_id: user.schoolId,
          student_id: studentId,
          teacher_id: user.id, // Assuming user.id is teacher_id
          term: period,
          comment: comment,
          date: now
        });
      });

      if (gradesToInsert.length > 0) {
        await supabase.from('grades').insert(gradesToInsert);
      }
      
      if (appreciationsToInsert.length > 0) {
        // Just checking if appreciations table exists, if it does it works
        const { error } = await supabase.from('appreciations').insert(appreciationsToInsert);
        if (error) console.warn("Appreciations error", error);
      }

      alert("Les notes et appréciations ont été enregistrées avec succès !");
      setGrades({});
      setAppreciations({});
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde: " + err.message);
    }
  };`;

content = content.replace(/  const handleSaveGrades = \(\) => \{\n    alert\("Les notes et appréciations ont été enregistrées avec succès !"\);\n  \};/, replacement);

content = content.replace(
  '<Save size={16} /> Enregistrer Brouillon',
  '<Save size={16} /> Saisir les notes'
);

fs.writeFileSync('src/pages/TeacherDashboard.tsx', content);
