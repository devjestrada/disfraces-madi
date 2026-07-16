import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePublicData } from '../context/PublicDataContext';
import WhatsAppIcon from './WhatsAppIcon';

interface WhatsAppButtonProps {
  selectedCostumeName?: string;
}

export default function WhatsAppButton({ selectedCostumeName }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const preFilledInquiries = [
    { text: '🗓️ Agendar cita para probarme un disfraz', label: 'Agendar Cita' },
  ];

  const { contactInfo } = usePublicData();

  const handleSendMessage = (messageText: string) => {
    const formattedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${contactInfo.whatsapp}?text=${formattedText}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    handleSendMessage(customText);
    setCustomText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end" id="whatsapp-floating-assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl border border-[#a8001a]/15 w-80 mb-4 overflow-hidden"
            id="whatsapp-popover-card"
          >
            {/* Header */}
            <div className="bg-[#a8001a] p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-[#fdc003] text-[#1e1b18] p-1.5 rounded-full">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm">Sra. Madi - WhatsApp</h4>
                  <p className="text-[10px] text-white/80 font-medium">Boutique de Carnaval • Online ahora</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                id="close-whatsapp-assistant"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-4 max-h-72 overflow-y-auto bg-[#fff8f5]">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#a8001a]/5 text-xs text-[#1e1b18]/90 leading-relaxed shadow-sm">
                ¡Hola! 👋 Soy la Sra. Madi. Cuéntame qué disfraz o servicio te interesa para brillar este Carnaval. Haz clic en una opción rápida o escríbeme abajo.
              </div>

              {selectedCostumeName && (
                <div className="bg-[#fdc003]/10 border border-[#fdc003]/30 p-2 rounded-xl text-[11px] text-[#846524] text-center font-medium">
                  Estás viendo: <strong>{selectedCostumeName}</strong>
                </div>
              )}

              {/* Quick Inquiry Buttons */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-mono tracking-wider text-[#846524] font-bold">Consultas Rápidas:</p>
                {preFilledInquiries.map((inquiry, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(inquiry.text)}
                    className="w-full text-left p-2.5 bg-white hover:bg-[#a8001a]/5 text-[#1e1b18] border border-[#a8001a]/10 hover:border-[#a8001a]/30 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    {inquiry.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleCustomSubmit} className="p-3 bg-white border-t border-[#a8001a]/10 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Escribe tu consulta aquí..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#a8001a]/10 focus:border-[#a8001a] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#a8001a]/20 bg-[#fff8f5]/50"
              />
              <button
                type="submit"
                className="bg-[#a8001a] hover:bg-[#a8001a]/90 text-white p-2.5 rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center"
                title="Enviar por WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4 text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#a8001a] hover:bg-[#920014] text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        style={{ boxShadow: '0 10px 25px -5px rgba(168, 0, 26, 0.4)' }}
        id="toggle-whatsapp-btn"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#a8001a] opacity-45 animate-ping group-hover:animate-none"></span>
        <WhatsAppIcon className="h-6.5 w-6.5 text-[#fdc003] relative z-10" />
        <span className="absolute -top-1 -left-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fdc003] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fdc003]"></span>
        </span>
      </button>
    </div>
  );
}
