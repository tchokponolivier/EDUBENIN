import fs from 'fs';

let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

content = content.replace(/import \{ db \} from "\.\.\/lib\/db";\n/g, '');

content = content.replace(
`    setSettings(db.getSchoolSettings());
    setAnnouncements(db.getAnnouncements());`,
`    fetchSchoolSettings();
    fetchAnnouncements();`
);

content = content.replace(
`  const fetchDashboardData = async () => {`,
`  const fetchSchoolSettings = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('schools').select('*').eq('id', user.schoolId).single();
    if (data) {
      setSettings({
        name: data.name,
        address: data.locality,
        contact: data.contacts,
        motto: data.motto || "",
        logo: data.logo_url || "",
        academicYear: data.academic_year || ""
      } as any);
    }
  };

  const fetchAnnouncements = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('announcements').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false });
    if (data) {
      setAnnouncements(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        authorName: d.author_name,
        date: new Date(d.created_at).getTime()
      })));
    }
  };

  const fetchDashboardData = async () => {`
);

content = content.replace(
`    db.updateSchoolSettings(updates);
    setSettings({ ...settings, ...updates });
    alert("Paramètres enregistrés avec succès.");`,
`    supabase.from('schools').update({
      name: updates.name,
      locality: updates.address,
      contacts: updates.contact,
      motto: updates.motto,
      academic_year: updates.academicYear,
      logo_url: updates.logo
    }).eq('id', user?.schoolId).then(({ error }) => {
       if (error) {
         alert("Erreur");
       } else {
         setSettings({ ...settings, ...updates });
         alert("Paramètres enregistrés avec succès.");
       }
    });`
);

content = content.replace(
`    const newAnnouncement = db.addAnnouncement({
      title: announcementTitle,
      content: announcementContent,
      authorName: user?.name || "Administration"
    });
    setAnnouncements([newAnnouncement, ...announcements]);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    alert("Annonce publiée.");`,
`    supabase.from('announcements').insert({
      school_id: user?.schoolId,
      title: announcementTitle,
      content: announcementContent,
      author_name: user?.name || "Administration"
    }).select().single().then(({ data, error }) => {
       if (error) {
          alert("Erreur");
       } else if (data) {
          setAnnouncements([{
            id: data.id,
            title: data.title,
            content: data.content,
            authorName: data.author_name,
            date: new Date(data.created_at).getTime()
          }, ...announcements]);
          setAnnouncementTitle("");
          setAnnouncementContent("");
          alert("Annonce publiée.");
       }
    });`
);

content = content.replace(
`  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm("Supprimer cette annonce ?")) {
      db.deleteAnnouncement(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };`,
`  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm("Supprimer cette annonce ?")) {
      supabase.from('announcements').delete().eq('id', id).then(({ error }) => {
         if (!error) {
           setAnnouncements(announcements.filter(a => a.id !== id));
         }
      });
    }
  };`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
