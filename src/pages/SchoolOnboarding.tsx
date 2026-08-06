import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { useAuth } from '../lib/auth';
import { School, Building, MapPin, Phone, CheckCircle } from 'lucide-react';

export function SchoolOnboarding() {
  const { user, login } = useAuth(); // assuming login or a refresh function updates context
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    locality: '',
    contacts: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create the school
      const school = db.addSchool({
          name: formData.name,
          locality: formData.locality,
          contacts: formData.contacts,
          mobileMoneyNumbers: {}
        });

      // 2. Update the profile with the new school_id
      // Mock profile update
if (user) {
  const updatedUser = { ...user, schoolId: school.id, role: 'SCHOOL_ADMIN' };
  localStorage.setItem("edubenin_auth", JSON.stringify(updatedUser));
}

      // 3. Update local auth context
      // We can force a page reload or call a refresh function. 
      window.location.href = "/dashboard";
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
            <School size={32} className="text-emerald-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configurez votre établissement
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Bienvenue sur EduBénin. Pour commencer, veuillez renseigner les informations de votre école.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de l'établissement
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                  placeholder="Ex: Complexe Scolaire Le Savoir"
                />
              </div>
            </div>

            <div>
              <label htmlFor="locality" className="block text-sm font-medium text-gray-700">
                Localité / Ville
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="locality"
                  id="locality"
                  required
                  value={formData.locality}
                  onChange={(e) => setFormData({...formData, locality: e.target.value})}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                  placeholder="Ex: Cotonou, Akpakpa"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contacts" className="block text-sm font-medium text-gray-700">
                Contact principal (Téléphone / Email)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="contacts"
                  id="contacts"
                  required
                  value={formData.contacts}
                  onChange={(e) => setFormData({...formData, contacts: e.target.value})}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                  placeholder="Ex: +229 97 00 00 00"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? 'Création en cours...' : 'Créer mon établissement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
