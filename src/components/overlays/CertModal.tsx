import type { ReactNode } from "react";
import ConfirmSheetApp from "@/features/confirmSheet/ConfirmSheetApp";

interface CertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CertModal({ isOpen, onClose }: CertModalProps): ReactNode {
  if (!isOpen) return null;

  return <ConfirmSheetApp onClose={onClose} />;
}
