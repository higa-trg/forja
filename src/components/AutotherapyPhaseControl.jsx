import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AutotherapyPhaseControl = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const protocolPhases = ['cronologico', 'somatico', 'tematico', 'futuro', 'potencializacao'];

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientAutotherapyAccess(selectedPatient);
    } else {
      setPhases([]);
    }
  }, [selectedPatient]);

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

  const fetchPatientAutotherapyAccess = async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('patient_autotherapy_access')
        .select('*')
        .eq('patient_id', patientId);
      if (error) throw error;

      const currentPhases = protocolPhases.map(phase => {
        const existing = data.find(p => p.protocol_phase === phase);
        return {
          protocol_phase: phase,
          is_unlocked: existing ? existing.is_unlocked : false,
          unlocked_at: existing ? existing.unlocked_at : null,
        };
      });
      setPhases(currentPhases);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePhase = async (phaseToToggle, isUnlocked) => {
    setLoading(true);
    setError(null);
    try {
      if (isUnlocked) {
        // Se já está desbloqueado, vamos bloquear
        const { error } = await supabase
          .from('patient_autotherapy_access')
          .update({ is_unlocked: false, unlocked_at: null })
          .eq('patient_id', selectedPatient)
          .eq('protocol_phase', phaseToToggle);
        if (error) throw error;
      } else {
        // Se está bloqueado, vamos desbloquear
        const { error } = await supabase
          .from('patient_autotherapy_access')
          .upsert(
            {
              patient_id: selectedPatient,
              protocol_phase: phaseToToggle,
              is_unlocked: true,
              unlocked_at: new Date().toISOString(),
            },
            { onConflict: ['patient_id', 'protocol_phase'] }
          );
        if (error) throw error;
      }
      fetchPatientAutotherapyAccess(selectedPatient); // Atualiza o estado
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
      <h2 className="text-2xl font-bold mb-6 text-center">Controle de Fases de Autoterapia</h2>

      <div className="mb-6">
        <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700">Paciente</label>
        <select
          id="patientSelect"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
        >
          <option value="">Selecione um paciente</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && phases.length > 0 && (
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.protocol_phase} className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
              <span className="text-lg font-medium">Fase: {phase.protocol_phase.charAt(0).toUpperCase() + phase.protocol_phase.slice(1)}</span>
              <button
                onClick={() => handleTogglePhase(phase.protocol_phase, phase.is_unlocked)}
                className={`px-4 py-2 rounded-md text-white text-sm font-medium ${phase.is_unlocked ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {phase.is_unlocked ? 'Bloquear' : 'Liberar'}
              </button>
            </div>
          ))}
        </div>
      )}
      {selectedPatient && phases.length === 0 && !loading && (
        <p className="text-center text-gray-600">Nenhuma fase de autoterapia encontrada para este paciente.</p>
      )}
    </div>
  );
};

export default AutotherapyPhaseControl;


