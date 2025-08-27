import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import PatientManagement from './components/PatientManagement';
import ClinicalRecord from './components/ClinicalRecord';
import AutotherapyPhaseControl from './components/AutotherapyPhaseControl';
import ActionPlanManagement from './components/ActionPlanManagement';
import PatientAdherence from './components/PatientAdherence';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('patients'); // 'patients', 'clinicalRecord', 'autotherapyControl', 'actionPlanManagement' or 'patientAdherence'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      {!session ? (
        <Auth />
      ) : (
        <div className="flex flex-col min-h-screen">
          <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">FORJA - Painel do Terapeuta</h1>
            <nav>
              <button
                onClick={() => setView('patients')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${view === 'patients' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
              >
                Pacientes
              </button>
              <button
                onClick={() => setView('clinicalRecord')}
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${view === 'clinicalRecord' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
              >
                Prontuário Clínico
              </button>
              <button
                onClick={() => setView('autotherapyControl')}
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${view === 'autotherapyControl' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
              >
                Controle Autoterapia
              </button>
              <button
                onClick={() => setView('actionPlanManagement')}
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${view === 'actionPlanManagement' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
              >
                Planos de Ação
              </button>
              <button
                onClick={() => setView('patientAdherence')}
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${view === 'patientAdherence' ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
              >
                Adesão do Paciente
              </button>
            </nav>
            <div className="flex items-center">
              <span className="mr-4">Olá, {session.user.email}</span>
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) alert(error.message);
                }}
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sair
              </button>
            </div>
          </header>
          <main className="flex-grow p-4">
            {view === 'patients' && <PatientManagement />}
            {view === 'clinicalRecord' && <ClinicalRecord />}
            {view === 'autotherapyControl' && <AutotherapyPhaseControl />}
            {view === 'actionPlanManagement' && <ActionPlanManagement />}
            {view === 'patientAdherence' && <PatientAdherence />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;


