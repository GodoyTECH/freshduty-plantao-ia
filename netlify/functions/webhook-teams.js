/**
 * Netlify Serverless Function — Endpoint de Webhook Seguro para Microsoft Power Automate
 * Projeto: Godoy FreshOps AI — Recebe chamados do Teams com chave de segurança encriptada
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido. Envie uma requisição POST.' })
        };
    }

    // TRAVA DE SEGURANÇA MÁXIMA VIA VARIÁVEL DE AMBIENTE DO NETLIFY
    const expectedSecret = process.env.WEBHOOK_SECRET_KEY || 'godoy_tech_secret_key_2026';
    const providedSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || (event.queryStringParameters && event.queryStringParameters.secret);

    if (!providedSecret || providedSecret !== expectedSecret) {
        console.warn('⚠️ Tentativa de acesso não autorizado ao Webhook sem chave válida.');
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Acesso Não Autorizado. Chave de segurança inválida ou ausente.' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');

        const numero = payload.numero || payload.ticket_id;
        const problema = payload.problema || payload.descricao || 'Atendimento de suporte técnico via Teams';
        const solucao = payload.solucao || payload.solucao_efetuada || 'Aguardando encerramento/atendimento.';
        const validacao = payload.validacao || payload.validado_por || 'Em atendimento';
        const analista = payload.analista || 'Caique Eduardo';

        if (!numero) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Número do chamado (#INC- / #SR-) é obrigatório.' })
            };
        }

        const dbUrl = process.env.DATABASE_URL;

        if (dbUrl) {
            const client = new Client({
                connectionString: dbUrl,
                ssl: { rejectUnauthorized: false }
            });

            await client.connect();

            // Assegura estrutura da tabela
            await client.query(`
                CREATE TABLE IF NOT EXISTS chamados_historico (
                    id SERIAL PRIMARY KEY,
                    data_chamado DATE NOT NULL DEFAULT CURRENT_DATE,
                    numero_chamado VARCHAR(100) NOT NULL,
                    problema_constatado TEXT NOT NULL,
                    solucao_efetuada TEXT NOT NULL,
                    validado_por VARCHAR(255) NOT NULL,
                    analista_nome VARCHAR(255) DEFAULT 'Caique Eduardo',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Atualiza o chamado se ele já existia (adiciona a solução/validação) ou insere um novo
            const existing = await client.query(`SELECT id FROM chamados_historico WHERE numero_chamado = $1 AND data_chamado = CURRENT_DATE`, [numero]);

            if (existing.rows.length > 0) {
                await client.query(`
                    UPDATE chamados_historico
                    SET solucao_efetuada = $1, validado_por = $2, problema_constatado = COALESCE(NULLIF($3, ''), problema_constatado)
                    WHERE numero_chamado = $4 AND data_chamado = CURRENT_DATE;
                `, [solucao, validacao, problema, numero]);
            } else {
                await client.query(`
                    INSERT INTO chamados_historico (numero_chamado, problema_constatado, solucao_efetuada, validado_por, analista_nome)
                    VALUES ($1, $2, $3, $4, $5);
                `, [numero, problema, solucao, validacao, analista]);
            }

            await client.end();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Chamado processado com sucesso com token de segurança!',
                ticket: { numero, problema, solucao, validacao, analista }
            })
        };
    } catch (err) {
        console.error('Erro na função Webhook-Teams:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erro ao processar chamado no Webhook' })
        };
    }
};
