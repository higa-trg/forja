import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ActionPlanManagement = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [actionPlans, setActionPlans] = useState([]);
  const [newPlanStartDate, setNewPlanStartDate] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskFrequency, setNewTaskFrequency] = useState('daily');
  const [newTaskCustomFrequency, setNewTaskCustomFrequency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchActionPlans(selectedPatient);
    } else {
      setActionPlans([]);
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

  const fetchActionPlans = async (patientId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('action_plans')
        .select('*, tasks(*)') // Seleciona planos e suas tarefas
        .eq('patient_id', patientId);
      if (error) throw error;
      setActionPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActionPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('action_plans')
        .insert([
          {
            patient_id: selectedPatient,
            therapist_id: (await supabase.auth.getSession()).data.session.user.id,
            start_date: newPlanStartDate,
          },
        ])
        .select();

      if (error) throw error;
      setActionPlans([...actionPlans, ...data]);
      setNewPlanStartDate('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (actionPlanId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            action_plan_id: actionPlanId,
            description: newTaskDescription,
            frequency: newTaskFrequency,
            custom_frequency_details: newTaskFrequency === 'custom' ? newTaskCustomFrequency : null,
          },
        ])
        .select();

      if (error) throw error;
      // Atualiza o estado dos planos de ação para incluir a nova tarefa
      setActionPlans(actionPlans.map(plan => 
        plan.id === actionPlanId ? { ...plan, tasks: [...plan.tasks, ...data] } : plan
      ));
      setNewTaskDescription('');
      setNewTaskFrequency('daily');
      setNewTaskCustomFrequency('');
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
      <h2 className="text-2xl font-bold mb-6 text-center">Gestão de Planos de Ação e Rotinas</h2>

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

      {selectedPatient && (
        <div className="mb-8 p-6 border rounded-md bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Adicionar Novo Plano de Ação</h3>
          <form onSubmit={handleAddActionPlan} className="space-y-4">
            <div>
              <label htmlFor="planStartDate" className="block text-sm font-medium text-gray-700">Data de Início</label>
              <input
                type="date"
                id="planStartDate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newPlanStartDate}
                onChange={(e) => setNewPlanStartDate(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Criar Plano de Ação'}
            </button>
          </form>
        </div>
      )}

      {selectedPatient && actionPlans.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-xl font-semibold mb-4">Planos de Ação Existentes</h3>
          {actionPlans.map((plan) => (
            <div key={plan.id} className="p-6 border rounded-md bg-white shadow-sm">
              <h4 className="text-lg font-bold mb-2">Plano de {plan.start_date}</h4>
              <ul className="list-disc pl-5 mb-4">
                {plan.tasks.map(task => (
                  <li key={task.id}>{task.description} ({task.frequency}{task.custom_frequency_details ? `: ${task.custom_frequency_details}` : ''})</li>
                ))}
              </ul>
              <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                <h5 className="text-md font-semibold mb-2">Adicionar Tarefa a este Plano</h5>
                <div>
                  <label htmlFor={`taskDescription-${plan.id}`} className="block text-sm font-medium text-gray-700">Descrição da Tarefa</label>
                  <input
                    type="text"
                    id={`taskDescription-${plan.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`taskFrequency-${plan.id}`} className="block text-sm font-medium text-gray-700">Frequência</label>
                  <select
                    id={`taskFrequency-${plan.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newTaskFrequency}
                    onChange={(e) => setNewTaskFrequency(e.target.value)}
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
                {newTaskFrequency === 'custom' && (
                  <div>
                    <label htmlFor={`customFrequency-${plan.id}`} className="block text-sm font-medium text-gray-700">Detalhes da Frequência Personalizada</label>
                    <input
                      type="text"
                      id={`customFrequency-${plan.id}`}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ex: Seg, Qua, Sex"
                      value={newTaskCustomFrequency}
                      onChange={(e) => setNewTaskCustomFrequency(e.target.value)}
                    />
                  </div>
                )}
                <button
                  onClick={() => handleAddTask(plan.id)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : 'Adicionar Tarefa'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPatient && actionPlans.length === 0 && !loading && (
        <p className="text-center text-gray-600">Nenhum plano de ação encontrado para este paciente. Crie um acima.</p>
      )}
    </div>
  );
};

export default ActionPlanManagement;


