import { FC } from 'react';
import { ConfirmationRequest } from '../types/bridge';

interface ConfirmationModalProps {
  isOpen: boolean;
  confirmation: ConfirmationRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  confirmation,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !confirmation) return null;

  const isHindi = confirmation.language === 'hi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-red-500/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            {isHindi ? 'पुष्टि आवश्यक' : 'Confirmation Required'}
          </h3>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-6 text-lg">
          {confirmation.response}
        </p>

        {/* Command Details */}
        <div className="bg-slate-800/50 rounded p-3 mb-6 text-sm">
          <div className="flex justify-between text-gray-400 mb-1">
            <span>Action:</span>
            <span className="text-cyan-400 font-mono">{confirmation.command_key}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Timeout:</span>
            <span className="text-orange-400">{confirmation.timeout}s</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
          >
            {isHindi ? 'पुष्टि करें' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
