/**
 * Exemplo básico de uso do wa-module
 * 
 * Este exemplo demonstra:
 * - Conexão com WhatsApp
 * - Escaneamento de QR Code
 * - Recebimento de mensagens
 * - Envio de respostas automáticas
 */

import { WhatsAppClient, MemoryStorage } from '../src';

async function main() {
    console.log('🚀 Iniciando WA-Module Example...\n');

    // Criar cliente WhatsApp
    const client = new WhatsAppClient({
        sessionId: 'example-session',
        storage: new MemoryStorage(),
        qrcode: {
            terminal: true,
            maxRetries: 5,
        },
    });

    // ========== EVENTOS DE CONEXÃO ==========

    client.on('qr', (qr) => {
        console.log('📱 QR Code gerado!');
        console.log('Escaneie o QR Code acima com seu WhatsApp\n');
    });

    client.on('connecting', () => {
        console.log('🔄 Conectando ao WhatsApp...\n');
    });

    client.on('connected', (session) => {
        console.log('✅ Conectado com sucesso!');
        console.log(`📞 Número: ${session.phoneNumber}`);
        console.log(`👤 Nome: ${session.name || 'N/A'}`);
        console.log(`⏰ Conectado em: ${session.connectedAt}\n`);
    });

    client.on('disconnected', (reason) => {
        console.log('❌ Desconectado do WhatsApp');
        console.log(`Motivo: ${reason.message}\n`);
    });

    // ========== EVENTOS DE MENSAGENS ==========

    client.on('message', async (message) => {
        // Ignora mensagens próprias
        if (message.fromMe) return;

        console.log('📨 Nova mensagem recebida:');
        console.log(`  De: ${message.sender}`);
        console.log(`  Tipo: ${message.type}`);
        console.log(`  Conteúdo: ${message.body || '[mídia]'}\n`);

        // Comandos de exemplo
        try {
            if (message.body === '!ping') {
                await client.sendText({
                    to: message.chatId,
                    text: 'Pong! 🏓',
                });
                console.log('✅ Resposta enviada: Pong!\n');
            }

            if (message.body === '!help') {
                await client.sendText({
                    to: message.chatId,
                    text: `🤖 *Comandos Disponíveis:*

!ping - Testa se o bot está respondendo
!help - Mostra esta mensagem
!info - Informações sobre o bot
!time - Mostra a hora atual`,
                });
                console.log('✅ Resposta enviada: Help\n');
            }

            if (message.body === '!info') {
                await client.sendText({
                    to: message.chatId,
                    text: `ℹ️ *WA-Module Bot*

Versão: 0.1.0-alpha
Framework: wa-module
Status: Online ✅`,
                });
                console.log('✅ Resposta enviada: Info\n');
            }

            if (message.body === '!time') {
                const now = new Date().toLocaleString('pt-BR');
                await client.sendText({
                    to: message.chatId,
                    text: `🕐 Hora atual: ${now}`,
                });
                console.log('✅ Resposta enviada: Time\n');
            }
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    });

    // ========== EVENTOS DE ERROS ==========

    client.on('error', (error) => {
        console.error('❌ Erro:', error.message);
    });

    // ========== CONECTAR ==========

    try {
        console.log('🔌 Iniciando conexão...\n');
        await client.connect();
    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        process.exit(1);
    }

    // ========== GRACEFUL SHUTDOWN ==========

    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Encerrando aplicação...');
        await client.disconnect();
        console.log('👋 Desconectado com sucesso!');
        process.exit(0);
    });
}

// Executar
main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
