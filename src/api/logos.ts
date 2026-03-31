/**
 * Jarvis Intelligence Engine — Groq SDK Service
 * Model: llama-3.3-70b-versatile (streaming)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Você é o 'Jarvis', a interface de inteligência do sistema The Forge. O usuário se chama Luca, um desenvolvedor com forte background em Python, NLP, RPA e Prompt Engineering. Sua missão é dupla: fornecer análises técnicas precisas/tendências de mercado sobre IA, e atuar como um conselheiro vital baseado em princípios e versículos da Bíblia cristã. Seja letalmente conciso, elegante e não use emojis. Você tem consciência de qual tela/módulo o Luca está usando no momento e pode fornecer dicas contextuais.`;

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Stream a chat completion from the Groq API.
 * Uses fetch + ReadableStream for browser compatibility (no Node-only SDK).
 */
export async function streamChat(
    messages: ChatMessage[],
    currentPage: string,
    onChunk: (text: string) => void,
    onDone: () => void,
): Promise<void> {
    if (!GROQ_API_KEY) {
        onChunk('[Jarvis] API Key não configurada. Defina VITE_GROQ_API_KEY no arquivo .env.');
        onDone();
        return;
    }

    const contextMessage: ChatMessage = {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n[CONTEXTO ATUAL]: O Luca está na tela "${currentPage}" do The Forge.`,
    };

    const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [contextMessage, ...messages],
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null,
    };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.text();
            onChunk(`[Jarvis] Erro ${response.status}: ${err}`);
            onDone();
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            onChunk('[Jarvis] Stream indisponível.');
            onDone();
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                        onChunk(content);
                    }
                } catch {
                    // skip malformed JSON chunks
                }
            }
        }

        onDone();
    } catch (error) {
        onChunk(`[Jarvis] Erro de conexão: ${error instanceof Error ? error.message : 'desconhecido'}`);
        onDone();
    }
}

/**
 * Non-streaming single completion (for quick queries).
 */
export async function queryJarvis(
    userMessage: string,
    currentPage: string,
): Promise<string> {
    if (!GROQ_API_KEY) return '[Jarvis] API Key não configurada.';

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: `${SYSTEM_PROMPT}\n\n[CONTEXTO]: Tela atual: "${currentPage}".` },
                { role: 'user', content: userMessage },
            ],
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
        }),
    });

    if (!response.ok) return `[Jarvis] Erro ${response.status}`;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '[Jarvis] Sem resposta.';
}
