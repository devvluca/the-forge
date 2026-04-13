/**
 * Serviço de autenticação Pluggy Connect via API REST.
 * 
 * ⚠️ NOTA: Estamos chamando a API diretamente do frontend provisoriamente para MVP.
 * A arquitetura futura migrará para uma Supabase Edge Function
 * para não expor as credenciais no client-side.
 */

const PLUGGY_API_BASE = 'https://api.pluggy.ai';

/**
 * Autentica com a Pluggy API e retorna um API key temporário.
 */
async function authenticate(): Promise<string> {
    const res = await fetch(`${PLUGGY_API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: import.meta.env.VITE_PLUGGY_CLIENT_ID,
            clientSecret: import.meta.env.VITE_PLUGGY_CLIENT_SECRET,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`[Pluggy Auth] ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.apiKey;
}

/**
 * Gera um Connect Token para iniciar o fluxo do Pluggy Connect widget.
 * 
 * No plano trial, apenas o "Pluggy Bank" (sandbox) está disponível.
 * Quando migrar para produção, remover o `options` de sandbox.
 */
export async function getPluggyConnectToken(): Promise<string> {
    const apiKey = await authenticate();

    const res = await fetch(`${PLUGGY_API_BASE}/connect_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
            // Habilita conectores sandbox para teste no plano trial
            options: {
                connectorTypes: [1, 2, 3, 4], // PERSONAL_BANK, BUSINESS_BANK, INVESTMENT, INVOICE
                sandbox: true,
            },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`[Pluggy ConnectToken] ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.accessToken;
}
