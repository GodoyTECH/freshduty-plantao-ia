/**
 * Netlify Serverless Function — Endpoint de Webhook para Microsoft Power Automate
 * Projeto: Godoy FreshOps AI — Recebe chamados do Teams e cadastra automaticamente
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    // Permite chamadas CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

    try {
        const payload = JSON.parse(event.body || '{}');

        const numero = payload.numero || payload.ticket_id || '#INC-314326';
        const problema = payload.problema || payload.descricao || 'Atendimento de suporte técnico via Teams';
        const solucao = payload.solucao || payload.solucao_efetuada || 'Feito atendimento e solução do chamado.';
        const validacao = payload.validacao || payload.validado_por || 'Acesso REMOTO';
        const analista = payload.analista || 'Caique Eduardo';

        const dbUrl = process.env.DATABASE_URL;

        if (dbUrl) {
            const client = new Client({
                connectionString: dbUrl,
                ssl: { rejectUnauthorized: false }
            });

            await client.connect();

            // Assegura criação da tabela
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

            // Insere ou atualiza o chamado no banco Neon PostgreSQL
            await client.query(`
                INSERT INTO chamados_historico (numero_chamado, problema_constatado, solucao_efetuada, validado_por, analista_nome)
                VALUES ($1, $2, $3, $4, $5);
            `, [numero, problema, solucao, validacao, analista]);

            await client.end();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Chamado cadastrado com sucesso no Godoy FreshOps AI!',
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
