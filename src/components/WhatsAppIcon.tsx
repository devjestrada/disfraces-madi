import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppIconProps {
  className?: string;
}

export default function WhatsAppIcon({ className }: WhatsAppIconProps) {
  return <FaWhatsapp aria-hidden="true" className={className} />;
}