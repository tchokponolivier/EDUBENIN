const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentProspectus.tsx', 'utf-8');

const fetchTarget = `supabase.from('schools').select('prospectus_data').eq('id', user.schoolId).single().then(({data}) => {
      if (data && data.prospectus_data) {
        setImageUrl(data.prospectus_data.imageUrl || imageUrl);
        setBottomImageUrl(data.prospectus_data.bottomImageUrl || "");
        setTexts(data.prospectus_data.texts || texts);
      }
    });`;
const fetchInsert = `supabase.from('fee_config').select('description').eq('school_id', user.schoolId).eq('level', 'PROSPECTUS_DATA').single().then(({data}) => {
      if (data && data.description) {
        try {
          const parsed = JSON.parse(data.description);
          setImageUrl(parsed.imageUrl || imageUrl);
          setBottomImageUrl(parsed.bottomImageUrl || "");
          setTexts(parsed.texts || texts);
        } catch(e) {}
      }
    });`;
content = content.replace(fetchTarget, fetchInsert);

const saveTarget = `if (user?.schoolId) {
      supabase.from('schools').update({
        prospectus_data: { imageUrl, bottomImageUrl, texts }
      }).eq('id', user.schoolId).then(() => {});
    }`;
const saveInsert = `if (user?.schoolId) {
      const payload = JSON.stringify({ imageUrl, bottomImageUrl, texts });
      supabase.from('fee_config').select('id').eq('school_id', user.schoolId).eq('level', 'PROSPECTUS_DATA').single().then(({data}) => {
        if (data) {
          supabase.from('fee_config').update({ description: payload }).eq('id', data.id).then(() => {});
        } else {
          supabase.from('fee_config').insert({ school_id: user.schoolId, level: 'PROSPECTUS_DATA', type: 'DATA', amount: 0, description: payload }).then(() => {});
        }
      });
    }`;
content = content.replace(saveTarget, saveInsert);

fs.writeFileSync('src/pages/ParentProspectus.tsx', content);
console.log("Patched prospectus 2");
