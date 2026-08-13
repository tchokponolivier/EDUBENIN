const fs = require('fs');
let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

const loadDataContent = `
  const loadData = async () => {
    if (!user) return;
    try {
      const { data: studentsData } = await supabase.from('students').select('*').eq('parent_id', user.id);
      if (studentsData) {
        setChildren(studentsData.map(s => ({
          id: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          level: s.level,
          status: s.status,
          dateOfBirth: s.date_of_birth,
          placeOfBirth: s.place_of_birth,
          gender: s.gender,
          studentType: s.student_type,
          previousClass: s.previous_class,
          previousSchool: s.previous_school,
          lastYearAttended: s.last_year_attended,
          educmasterNumber: s.educmaster_number,
          nationality: s.nationality,
          religion: s.religion,
          fatherName: s.father_name,
          motherName: s.mother_name,
          fatherProfession: s.father_profession,
          motherProfession: s.mother_profession,
          fatherContact: s.father_contact,
          fatherAddress: s.father_address,
          motherContact: s.mother_contact,
          motherAddress: s.mother_address,
          guardianName: s.guardian_name,
          guardianContact: s.guardian_contact,
          guardianAddress: s.guardian_address,
          canteenOptions: s.canteen_options ? s.canteen_options.split(', ') : [],
          disciplinaryCommitment: s.disciplinary_commitment,
          disciplinarySignature: s.disciplinary_signature,
          photo: s.photo || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop"
        })));
      }
      
      const { data: annData } = await supabase.from('announcements').select('*').order('date', { ascending: false });
      if (annData) {
        setAnnouncements(annData.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.date,
          author: a.author,
          targetAudience: a.target_audience
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToAnnouncement = (index: number) => {
    setActiveAnnouncementIndex(index);
    if (carouselRef.current) {
      const width = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };
`;

content = content.replace('  const handleDisplayForm = (child?: Student) => {', loadDataContent + '\n  const handleDisplayForm = (child?: Student) => {');

fs.writeFileSync('src/pages/Parent.tsx', content);
