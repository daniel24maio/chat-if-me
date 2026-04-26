import React from 'react';
import ChatInterface from './components/ChatInterface/ChatInterface';

// Nota: Se houver um arquivo de estilos globais (ex: global.css ou index.css),
// certifique-se de importá-lo aqui para resetar o CSS padrão do navegador.
// Ex: import './globals.css'; 

export default function App() {
  return (
    <React.StrictMode>
      <ChatInterface />
    </React.StrictMode>
  );
}