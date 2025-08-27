import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ClinicalRecord = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [sessionType, setSessionType] = useState('guided');
  const [protocolPhase, setProtocolPhase] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [discomfortBefore, setDiscomfortBefore] = useState('');
  const [discomfortAfter, setDiscomfortAfter] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name');
      if (error) throw error;
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Inserir a sessão principal
      const { data: sessionData, error: sessionError } = await supabase
        .from('reprocessing_sessions')
        .insert([
          {
            patient_id: selectedPatient,
            therapist_id: (await supabase.auth.getSession()).data.session.user.id,
            session_type: sessionType,
            notes: notes,
          },
        ])
        .select();

      if (sessionError) throw sessionError;

      const newSessionId = sessionData[0].id;

      // Inserir a entrada de reprocessamento
      const { error: entryError } = await supabase
        .from('reprocessing_entries')
        .insert([
          {
            session_id: newSessionId,
            protocol_phase: protocolPhase,
            age_range: protocolPhase === 'cronologico' ? ageRange : null,
            discomfort_score_before: discomfortBefore,
            discomfort_score_after: discomfortAfter,
            event_description: eventDescription,
          },
        ]);

      if (entryError) throw entryError;

      alert('Sessão e entrada de reprocessamento adicionadas com sucesso!');
      // Limpar formulário
      setSelectedPatient('');
      setProtocolPhase('');
      setAgeRange('');
      setDiscomfortBefore('');
      setDiscomfortAfter('');
      setEventDescription('');
      setNotes('');
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
      <h2 className="text-2xl font-bold mb-6 text-center">Prontuário Clínico</h2>

      <form onSubmit={handleAddSession} className="space-y-4 mb-8 p-6 border rounded-md bg-gray-50">
        <h3 className="text-xl font-semibold mb-4">Registrar Nova Sessão</h3>
        <div>
          <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700">Paciente</label>
          <select
            id="patientSelect"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            required
          >
            <option value="">Selecione um paciente</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="protocolPhase" className="block text-sm font-medium text-gray-700">Fase do Protocolo</label>
          <select
            id="protocolPhase"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={protocolPhase}
            onChange={(e) => setProtocolPhase(e.target.value)}
            required
          >
            <option value="">Selecione a fase</option>
            <option value="cronologico">Cronológico</option>
            <option value="somatico">Somático</option>
            <option value="tematico">Temático</option>
            <option value="futuro">Futuro</option>
            <option value="potencializacao">Potencialização</option>
          </select>
        </div>

        {protocolPhase === 'cronologico' && (
          <div>
            <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">Faixa Etária (Cronológico)</label>
            <input
              type="text"
              id="ageRange"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: 0-10 anos, 10-15 anos"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">Descrição do Evento ('Pior Filme')</label>
          <textarea
            id="eventDescription"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows="3"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="discomfortBefore" className="block text-sm font-medium text-gray-700">Desconforto Antes (0-10)</label>
            <input
              type="number"
              id="discomfortBefore"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="0"
              max="10"
              value={discomfortBefore}
              onChange={(e) => setDiscomfortBefore(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="discomfortAfter" className="block text-sm font-medium text-gray-700">Desconforto Depois (0-10)</label>
            <input
              type="number"
              id="discomfortAfter"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="0"
              max="10"
              value={discomfortAfter}
              onChange={(e) => setDiscomfortAfter(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações Gerais da Sessão</label>
          <textarea
            id="notes"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Sessão'}
        </button>
      </form>
    </div>
  );
};

export default ClinicalRecord;


