import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PatientAdherence = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [adherenceData, setAdherenceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchAdherenceData(selectedPatient);
    } else {
      setAdherenceData([]);
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

  const fetchAdherenceData = async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          description,
          frequency,
          custom_frequency_details,
          task_completions(id, completion_date)
        `)
        .eq('action_plans.patient_id', patientId); // Assuming tasks are linked to action_plans which are linked to patients

      if (error) throw error;

      // Processar os dados para calcular a adesão
      const processedData = data.map(task => {
        const completedCount = task.task_completions.length;
        // Lógica simplificada para adesão: apenas conta as conclusões
        // Em uma versão mais avançada, calcularia % com base na frequência
        return {
          id: task.id,
          description: task.description,
          frequency: task.frequency,
          completed: completedCount,
          // Adicionar lógica para total esperado se necessário
        };
      });
      setAdherenceData(processedData);

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
      <h2 className="text-2xl font-bold mb-6 text-center">Adesão do Paciente aos Planos de Ação</h2>

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

      {selectedPatient && adherenceData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Tarefas e Conclusões</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concluídas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adherenceData.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.frequency}{task.custom_frequency_details ? ` (${task.custom_frequency_details})` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPatient && adherenceData.length === 0 && !loading && (
        <p className="text-center text-gray-600">Nenhum plano de ação ou tarefa encontrada para este paciente.</p>
      )}
    </div>
  );
};

export default PatientAdherence;


