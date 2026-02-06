import http from 'http';
import { randomBytes } from 'crypto';

const API_URL = 'http://localhost:3000';
const WEBHOOK_PORT = 4000;
const WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}/webhook`;
const SESSION_ID = 'main-session';
const TARGET_PHONE = process.argv[2] || '5548996846044';

// Gera código curto de verificação
const SECRET_CODE = `ABC-${randomBytes(2).toString('hex').toUpperCase()}`;

// Lista de IDs de mensagens enviadas pelo BOT para ignorar loop
const sentMessageIds = new Set<string>();
// Cache de mensagens recebidas para evitar processamento duplicado
const processedIncomingIds = new Set<string>();
let isFinished = false;

async function main() {
    console.log('🚀 Iniciando Teste Interativo de Fluxo Completo\n');
    console.log(`📡 API Destino: ${API_URL}`);
    console.log(`🎣 Webhook Local: ${WEBHOOK_URL}`);
    console.log(`📱 Telefone: ${TARGET_PHONE}`);
    console.log(`🔑 CÓDIGO SECRETO: ${SECRET_CODE}\n`);

    // 1. Iniciar Servidor de Webhook Local
    const server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/webhook') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    handleWebhook(payload);
                    res.writeHead(200);
                    res.end('OK');
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(WEBHOOK_PORT, async () => {
        console.log(`👂 Ouvindo webhooks na porta ${WEBHOOK_PORT}...`);

        try {
            await runTestFlow();
        } catch (err: any) {
            console.error('❌ Erro no teste:', err.message);
            cleanupAndExit(1);
        }
    });

    // Função que processa os eventos recebidos
    async function handleWebhook(payload: any) {
        if (isFinished) return;
        if (payload.event !== 'message') return;

        // O payload.data é o objeto { messages: WAMessage[], type: 'notify' | 'append' }
        const upsert = payload.data;

        // 1. Filtrar eventos (geralmente recebidas sao 'notify', enviadas sao 'append')
        if (upsert.type === 'append') {
            return;
        }

        const msg = upsert?.messages?.[0];
        if (!msg) return;

        const msgKey = msg.key;

        // 🚨 CRÍTICO: Filtros de Loop Infinito

        // 2. Ignorar mensagens marcadas como 'fromMe'
        if (msgKey?.fromMe) {
            return;
        }

        // 3. Ignorar mensagens cujos IDs nós mesmos geramos
        if (msgKey?.id) {
            if (sentMessageIds.has(msgKey.id)) {
                console.log(`👻 Ignorando ID de mensagem enviada pelo bot: ${msgKey.id}`);
                return;
            }
            // 4. Ignorar mensagens recebidas duplicadas (mesmo ID)
            if (processedIncomingIds.has(msgKey.id)) {
                // console.log(`🔄 Ignorando mensagem duplicada via webhook: ${msgKey.id}`);
                return;
            }
            processedIncomingIds.add(msgKey.id);
        }

        // Extrai texto da mensagem
        const msgContent = msg.message;
        const msgText = msgContent?.conversation ||
            msgContent?.extendedTextMessage?.text || '';

        if (!msgText) return;

        console.log(`📨 Recebi de ${msg.pushName || 'Usuário'} (${msgKey.remoteJid}): "${msgText}"`);

        // Normaliza para comparar
        const received = msgText.trim().toUpperCase();

        // Verifica código
        if (received.includes(SECRET_CODE)) {
            if (isFinished) return;
            isFinished = true;

            console.log('\n✅ CÓDIGO CORRETO RECEBIDO!');

            server.close(); // Fecha porta

            await sendMessage(`✅ Código ${SECRET_CODE} validado com sucesso! Teste finalizado.`, true);
            console.log('🎉 Confirmação final enviada. Encerrando processo...');
            process.exit(0);

        } else {
            console.log('⚠️ Código incorreto/Mensagem chat. Solicitando novamente...');
            await sendMessage(`❌ Código incorreto. Aguardando: *${SECRET_CODE}*`);
        }
    }

    async function sendMessage(text: string, isFinal: boolean = false) {
        const sendRes = await fetch(`${API_URL}/session/${SESSION_ID}/message/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: TARGET_PHONE,
                message: text
            })
        });

        if (!sendRes.ok) {
            console.error(`Falha ao enviar mensagem: ${await sendRes.text()}`);
            return;
        }

        const data = await sendRes.json() as any;
        if (data.messageId) {
            sentMessageIds.add(data.messageId); // Registra ID para ignorar se voltar no webhook
        }
    }

    async function runTestFlow() {
        // 2. Registrar Webhook na API
        console.log('🔗 Registrando webhook na API...');

        try {
            const regRes = await fetch(`${API_URL}/session/${SESSION_ID}/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: WEBHOOK_URL,
                    events: ['message']
                })
            });
            if (!regRes.ok) console.warn('Webhook warning:', await regRes.text());
        } catch (e) {
            console.warn('Erro ao registrar webhook (talvez ja exista).');
        }

        // 3. Enviar Mensagem Inicial
        console.log(`📤 Enviando desafio inicial ${SECRET_CODE}...`);

        await sendMessage(`🤖 Teste Interativo.\nResponda com: *${SECRET_CODE}*`);

        console.log('✅ Desafio enviado. Aguardando interação...');

        // Timeout
        setTimeout(() => {
            console.log('\n❌ Tempo esgotado!');
            cleanupAndExit(1);
        }, 120000);
    }

    function cleanupAndExit(code: number) {
        server.close();
        process.exit(code);
    }
}

main();
