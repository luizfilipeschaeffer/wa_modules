/**
 * Script de Teste Automatizado para API WhatsApp
 * Uso: npx tsx examples/test-api.ts [NUMERO_DESTINO]
 * Exemplo: npx tsx examples/test-api.ts 5511999999999
 */

const API_URL = 'http://localhost:3000';
const SESSION_ID = 'main-session';

// Pega o número do argumento ou usa um padrão (ajuste conforme necessário)
const TARGET_PHONE = process.argv[2] || '5548996846044';

async function main() {
    console.log('🚀 Iniciando Teste de Validação da API\n');
    console.log(`📡 URL da API: ${API_URL}`);
    console.log(`🔑 Sessão: ${SESSION_ID}`);
    console.log(`📱 Destinatário: ${TARGET_PHONE}\n`);

    try {
        // 1. Verificar Status da Conexão
        process.stdout.write('🔍 Passo 1: Verificando status da conexão... ');
        const statusRes = await fetch(`${API_URL}/session/${SESSION_ID}/status`);

        if (!statusRes.ok) {
            console.log('❌ Falha ao conectar na API');
            console.log(await statusRes.text());
            process.exit(1);
        }

        const statusData = await statusRes.json() as any;
        console.log(statusData.state === 'connected' ? '✅ CONECTADO' : `⚠️ Estado: ${statusData.state}`);

        if (statusData.state !== 'connected') {
            console.log('\n⚠️ A sessão não está conectada. Por favor, conecte via QR Code primeiro.');
            console.log(`🔗 Link QR: ${API_URL}/session/${SESSION_ID}/qr-code`);
            process.exit(1);
        }

        // 2. Enviar Mensagem
        process.stdout.write(`\n📤 Passo 2: Enviando mensagem de teste para ${TARGET_PHONE}... `);

        const payload = {
            to: TARGET_PHONE,
            message: `🤖 Teste de API realizado em ${new Date().toLocaleString()} ✅`
        };

        const sendRes = await fetch(`${API_URL}/session/${SESSION_ID}/message/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!sendRes.ok) {
            console.log('❌ FALHA NO ENVIO');
            const errorText = await sendRes.text();
            console.error('Resposta da API:', errorText);
            process.exit(1);
        }

        const sendData = await sendRes.json() as any;

        if (sendData.success) {
            console.log('✅ SUCESSO!');
            console.log(`🆔 Message ID: ${sendData.messageId}`);
            console.log('\n🎉 A API funcionou corretamente! A mensagem foi enfileirada para envio.');
        } else {
            console.log('❌ A API retornou sucesso: false');
            console.log(sendData);
        }

    } catch (error) {
        console.error('\n❌ Erro crítico ao executar o teste:', error);
        console.log('Verifique se a API está rodando em outro terminal (npm run start:api)');
    }
}

main();
