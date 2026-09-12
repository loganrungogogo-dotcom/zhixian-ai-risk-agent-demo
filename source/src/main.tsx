import React from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import './domestic.css';
import { installLocalApi } from '@/lib/local-api';
import App from './App';

installLocalApi();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
