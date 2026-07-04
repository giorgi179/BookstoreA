import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import '@n8n/chat/dist/style.css';
import { createChat } from '@n8n/chat';

function getCurrentLanguage(): string {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang?.trim();
    if (lang) {
      return lang;
    }
  }
  return 'ka';
}

function initN8nChat(): void {
  const target = document.querySelector<HTMLElement>('#n8n-chat');

  if (!target) {
    console.warn('n8n chat target element not found');
    return;
  }

  try {
    createChat({
      webhookUrl: 'https://giorgi0012.app.n8n.cloud/webhook/aa4c578f-3f2a-42cb-8590-22c2d2b78a09/chat',
      target,
      metadata: {
        language: getCurrentLanguage(),
      },
      mode: 'window',
      showWelcomeScreen: true,
      defaultLanguage: 'en',
      loadPreviousSession: true,
      enableStreaming: true,
      initialMessages: ['გამარჯობა! თუ გსურთ, უბრალოდ დაწერეთ თქვენი შეკითხვა.'],
      i18n: {
        en: {
          title: 'Hello! 👋',
          subtitle: 'Ask a question or start a conversation.',
          footer: '',
          getStarted: 'New Conversation',
          inputPlaceholder: 'Type your question..',
          closeButtonTooltip: 'Close chat',
        },
      },
    });
  } catch (err) {
    console.error('n8n chat initialization failed', err);
  }
}

bootstrapApplication(App, appConfig)
  .then(() => initN8nChat())
  .catch((err) => console.error(err));
