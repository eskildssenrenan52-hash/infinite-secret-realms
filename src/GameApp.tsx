import React, { Component, useEffect, useRef, useState } from 'react';
import { GameShell } from './components/game/GameShell';
import { GameEngine } from './game/engine';
import { signInWithGoogle, signOutFirebase, subscribeAuth } from './lib/firebase';
import { realtimePersistence } from './lib/sandboxPersistence';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Erro inesperado no jogo.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#07050d] p-6 text-center text-[#f5efe6]">
          <div className="max-w-md border-2 border-[#ff5c8a] bg-[#140e24] p-5 shadow-[0_6px_0_0_#07050d]">
            <h1 className="font-pixel text-lg font-bold text-[#ff708d]">
              Algo interrompeu a expedição
            </h1>
            <p className="mt-2 font-body-pixel text-xs text-[#d5cce6]">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 border-2 border-[#07050d] bg-[#4df0c0] px-4 py-1.5 font-pixel text-xs font-bold text-[#07050d]"
            >
              Recarregar Jogo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCloudUserEmail(user?.email ?? null);
      realtimePersistence.attachUser(user, (remotePayload) => {
        engineRef.current?.applyRemoteSandboxSave(remotePayload);
      });
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <AppErrorBoundary>
      <GameShell
        cloudUserEmail={cloudUserEmail}
        onCloudSignIn={() => {
          void signInWithGoogle();
        }}
        onCloudSignOut={() => {
          void signOutFirebase();
        }}
        onEngineReady={(engine) => {
          engineRef.current = engine;
        }}
      />
    </AppErrorBoundary>
  );
}
