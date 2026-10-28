import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LuxOutdoor ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });

    // Si c'est une erreur de chargement de chunk (mise à jour d'assets PWA), recharge automatiquement une fois
    const isChunkError =
      error.message &&
      (error.message.includes('dynamically imported module') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('Failed to fetch'));

    if (isChunkError && typeof window !== 'undefined') {
      const retryKey = 'lux_chunk_reload_retry';
      const lastRetry = sessionStorage.getItem(retryKey);
      if (!lastRetry) {
        sessionStorage.setItem(retryKey, 'true');
        window.location.reload();
      }
    }
  }

  private handleHardReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
    } catch (e) {
      console.warn('Error clearing caches', e);
    }
    window.location.reload();
  };

  private handleResetAll = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await this.handleHardReload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-white">
              Une anomalie d'affichage est survenue
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              L'application a rencontré une interruption lors du rendu sur cet appareil (iPad / Safari).
              Une réactualisation du cache ou un rechargement permet de rétablir l'affichage normal.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/70 p-3 rounded-xl text-left border border-slate-800 overflow-x-auto text-[11px] font-mono text-rose-300 max-h-32">
                <span className="font-bold">{this.state.error.name}: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleHardReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser & Vider le cache</span>
              </button>

              <button
                onClick={this.handleResetAll}
                className="py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                title="Réinitialise le stockage local pour résoudre les conflits de données corrompues"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
