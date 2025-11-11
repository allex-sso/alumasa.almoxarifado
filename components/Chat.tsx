import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat as GeminiChat } from "@google/genai";
import { SendIcon, CloseIcon } from './icons/Icons';
import Button from './ui/Button';

interface ChatProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const chatInstance = useRef<GeminiChat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const initializeChat = () => {
             try {
                const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
                const chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: "Você é um assistente virtual para o sistema 'Alumasa Controle do Almoxarifado'. Seu objetivo é ajudar os usuários a entender e navegar pelo sistema. Responda de forma amigável, concisa e focada nas funcionalidades do sistema, como gerenciamento de estoque, entradas, saídas, relatórios, auditoria e backup. Não responda a perguntas fora deste tópico.",
                    },
                });
                chatInstance.current = chat;
                setMessages([{ role: 'model', text: 'Olá! Como posso ajudar você a usar o sistema de controle de almoxarifado hoje?' }]);
            } catch (e) {
                console.error("Failed to initialize chat:", e);
                setError("Não foi possível iniciar o assistente. Verifique a configuração da API.");
            }
        };
        initializeChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatInstance.current) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatInstance.current.sendMessage({ message: input });
            const modelMessage: Message = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
            console.error("Error sending message:", e);
            const errorMessage: Message = { role: 'model', text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
            setError('Falha ao obter resposta do assistente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-5 z-50 w-full max-w-sm rounded-lg bg-white shadow-2xl flex flex-col h-[60vh]">
            <header className="flex items-center justify-between p-3 bg-[#002347] text-white rounded-t-lg">
                <h3 className="font-semibold text-lg">Assistente Virtual</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-800 transition-colors" aria-label="Fechar chat">
                    <CloseIcon />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                           <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl px-4 py-2 bg-gray-200 text-gray-800 flex items-center">
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></span>
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                 {error && (
                    <div className="text-center text-xs text-red-500">{error}</div>
                 )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-3 border-t bg-white rounded-b-lg">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua pergunta..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="rounded-full !p-3"
                    >
                        <SendIcon />
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default Chat;