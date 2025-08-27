import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientsAndTherapists();
  }, []);

  const fetchPatientsAndTherapists = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*');
      if (patientsError) throw patientsError;
      setPatients(patientsData);

      const { data: therapistsData, error: therapistsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'terapeuta');
      if (therapistsError) throw therapistsError;
      setTherapists(therapistsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([
          { 
            full_name: newPatientName,
            email: newPatientEmail,
            phone: newPatientPhone,
            therapist_id: selectedTherapist || null // Atribui o terapeuta selecionado
          }
        ])
        .select();

      if (error) throw error;
      setPatients([...patients, ...data]);
      setNewPatientName('');
      setNewPatientEmail('');
      setNewPatientPhone('');
      setSelectedTherapist('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Carregando...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Erro: {error}</div>;

  return (
    <div className="p-8 bg-white rounded shadow-md max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Gestão de Pacientes</h2>

      <form onSubmit={handleAddPatient} className="space-y-4 mb-8 p-6 border rounded-md bg-gray-50">
        <h3 className="text-xl font-semibold mb-4">Adicionar Novo Paciente</h3>
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input
            type="text"
            id="patientName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="patientEmail"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={newPatientEmail}
            onChange={(e) => setNewPatientEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="text"
            id="patientPhone"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={newPatientPhone}
            onChange={(e) => setNewPatientPhone(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">Atribuir Terapeuta</label>
          <select
            id="therapist"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
          >
            <option value="">Nenhum</option>
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.full_name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar Paciente'}
        </button>
      </form>

      <h3 className="text-xl font-semibold mb-4">Pacientes Cadastrados</h3>
      {patients.length === 0 ? (
        <p className="text-center text-gray-600">Nenhum paciente cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terapeuta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {therapists.find(t => t.id === patient.therapist_id)?.full_name || 'Nenhum'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;


