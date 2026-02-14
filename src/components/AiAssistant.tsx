'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit } = useChat();

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
                    aria-label="Open AI Assistant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                        <h3 className="font-semibold">Harmony AI</h3>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-gray-800 p-1 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10 text-sm">
                                How can I help you with your operations today?
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2">
                        <input
                            className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:outline-none"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                        />
                        <button type="submit" className="bg-black text-white h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}