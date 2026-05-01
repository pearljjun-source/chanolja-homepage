'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context.confirm
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  const variantColors = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const variant = state?.options.variant || 'danger'
  const colors = variantColors[variant]

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleCancel}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-800 text-center mb-2">
              {state.options.title}
            </h3>
            {state.options.message && (
              <p className="text-sm text-slate-500 text-center mb-6">
                {state.options.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                {state.options.cancelText || '취소'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 ${colors.button} text-white text-sm font-medium rounded-lg transition-colors`}
              >
                {state.options.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
