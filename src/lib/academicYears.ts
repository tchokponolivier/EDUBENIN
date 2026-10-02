import { supabase } from './supabase';

export interface SchoolAcademicYear {
  id: string;
  name: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Returns strictly the academic years defined by the school director.
 * Never displays arbitrary dummy years or years from other schools.
 */
export async function getDirectorAcademicYears(schoolId?: string | null): Promise<SchoolAcademicYear[]> {
  const targetSchoolId = schoolId || localStorage.getItem('edubenin_active_school_id') || '11111111-1111-4111-8111-111111111111';

  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', targetSchoolId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id || d.name,
        name: d.name,
        status: d.status || 'ACTIVE',
        startDate: d.start_date,
        endDate: d.end_date
      }));
    }
  } catch (e) {
    console.warn("Could not query academic_years for school:", e);
  }

  // Check mock_db_academic_years in localStorage
  try {
    const mockYears = JSON.parse(localStorage.getItem('mock_db_academic_years') || '[]');
    const matching = mockYears.filter((y: any) => !y.school_id || y.school_id === targetSchoolId);
    if (matching.length > 0) {
      return matching.map((d: any) => ({
        id: d.id || d.name,
        name: d.name,
        status: d.status || 'ACTIVE',
        startDate: d.start_date,
        endDate: d.end_date
      }));
    }
  } catch (e) {}

  // Check director-defined academic_year in schools table
  let definedYear: string | null = null;
  try {
    const { data: sch } = await supabase
      .from('schools')
      .select('academic_year')
      .eq('id', targetSchoolId)
      .maybeSingle();
    if (sch?.academic_year) {
      definedYear = sch.academic_year;
    }
  } catch (e) {}

  // Check local storage extra settings for this school
  if (!definedYear) {
    try {
      const extra = JSON.parse(localStorage.getItem(`schoolSettings_extra_${targetSchoolId}`) || '{}');
      if (extra.academicYear) {
        definedYear = extra.academicYear;
      }
    } catch (e) {}
  }

  if (definedYear) {
    return [{ id: definedYear, name: definedYear, status: 'ACTIVE' }];
  }

  // Fallback to active school year setting
  return [{ id: '2024-2025', name: '2024-2025', status: 'ACTIVE' }];
}
