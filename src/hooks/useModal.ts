import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const DEFAULT_MODAL_STATE: ModalState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false
};

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>(DEFAULT_MODAL_STATE);

  const showModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    danger = false
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      danger
    });
  };

  const closeModal = () => {
    setModalState(DEFAULT_MODAL_STATE);
  };

  return {
    modalState,
    showModal,
    closeModal
  };
};