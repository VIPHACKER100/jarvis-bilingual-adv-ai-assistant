import { FC } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ConfirmationRequest } from '../types/bridge';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

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
  onCancel,
}) => {
  if (!confirmation) return null;

  const isHindi = confirmation.language === 'hi';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center border border-danger/30">
          <ShieldAlert className="w-6 h-6 text-danger" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isHindi ? 'पुष्टि आवश्यक' : 'Confirmation Required'}
          </h3>
          <p className="text-sm text-foreground-muted">{confirmation.response}</p>
        </div>

        <div className="w-full p-4 bg-background-deep border border-border-default rounded-lg">
          <div className="flex justify-between text-xs text-foreground-muted mb-2">
            <span className="font-mono uppercase tracking-wider">Action</span>
            <span className="font-mono font-semibold text-accent">{confirmation.command_key}</span>
          </div>
          <div className="flex justify-between text-xs text-foreground-muted">
            <span className="font-mono uppercase tracking-wider">Timeout</span>
            <span className="font-mono font-semibold text-warning">{confirmation.timeout}s</span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
          >
            {isHindi ? 'पुष्टि करें' : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
