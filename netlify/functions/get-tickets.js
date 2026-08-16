/**
 * Netlify Serverless Function — GET /api/get-tickets
 * Projeto: Godoy FreshOps AI — Busca chamados no Neon DB com filtro por data e fallback automatico
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const rawDbUrl = process.env.DATABASE_URL;

    if (!rawDbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                source: 'local_storage',
                message: 'DATABASE_URL não configurada no Netlify.',
                tickets: []
            })
        };
    }

    let client = null;

    try {
        const cleanDbUrl = rawDbUrl.split('?')[0];
        client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS chamados_historico (
                id SERIAL PRIMARY KEY,
                data_chamado DATE NOT NULL DEFAULT CURRENT_DATE,
                numero_chamado VARCHAR(100) NOT NULL,
                problema_constatado TEXT NOT NULL,
                solucao_efetuada TEXT NOT NULL DEFAULT 'Aguardando atendimento',
                validado_por VARCHAR(255) NOT NULL DEFAULT 'Em atendimento',
                status_atendimento VARCHAR(50) NOT NULL DEFAULT 'EM_ATENDIMENTO',
                analista_nome VARCHAR(255) DEFAULT 'Caique Eduardo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const filterDate = (event.queryStringParameters && event.queryStringParameters.date) ? event.queryStringParameters.date : null;

        let result;

        if (filterDate) {
            const query = `
                SELECT 
                    id::text,
                    numero_chamado as numero,
                    problema_constatado as problema,
                    solucao_efetuada as solucao,
                    validado_por as validacao,
                    COALESCE(status_atendimento, 'EM_ATENDIMENTO') as status_atendimento,
                    TO_CHAR(data_chamado, 'DD/MM/YYYY') as data,
                    created_at
                FROM chamados_historico
                WHERE data_chamado = $1::date
                ORDER BY id DESC;
            `;
            result = await client.query(query, [filterDate]);
        }

        // Se não veio resultado na data específica ou se não forneceu data, faz o fallback buscando os chamados mais recentes
        if (!filterDate || !result || result.rows.length === 0) {
            const queryFallback = `
                SELECT 
                    id::text,
                    numero_chamado as numero,
                    problema_constatado as problema,
                    solucao_efetuada as solucao,
                    validado_por as validacao,
                    COALESCE(status_atendimento, 'EM_ATENDIMENTO') as status_atendimento,
                    TO_CHAR(data_chamado, 'DD/MM/YYYY') as data,
                    created_at
                FROM chamados_historico
                ORDER BY id DESC
                LIMIT 100;
            `;
            result = await client.query(queryFallback);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                source: 'neon_db',
                tickets: result.rows
            })
        };
    } catch (err) {
        console.error('Erro get-tickets Neon DB:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erro de conexão com o banco Neon' })
        };
    } finally {
        if (client) {
            await client.end().catch(() => {});
        }
    }
};
