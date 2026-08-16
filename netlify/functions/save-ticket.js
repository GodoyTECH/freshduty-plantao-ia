/**
 * Netlify Serverless Function — POST /api/save-ticket
 * Projeto: Godoy FreshOps AI — Salva ou atualiza chamado no Neon PostgreSQL
 * Com gerenciamento de conexão robusto (finally block) e suporte Fuso BR
 */

const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido.' }) };
    }

    const rawDbUrl = process.env.DATABASE_URL;

    if (!rawDbUrl) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: false, message: 'DATABASE_URL não configurada no Netlify.' })
        };
    }

    let client = null;

    try {
        const payload = JSON.parse(event.body || '{}');

        const numero = payload.numero;
        const problema = payload.problema || 'Atendimento de suporte técnico';
        const solucao = payload.solucao || 'Aguardando atendimento';
        const validacao = payload.validacao || 'Em atendimento';
        const analista = payload.analista || 'Caique Eduardo';
        const isConcluido = solucao && !solucao.includes('Aguardando');
        const statusAtendimento = isConcluido ? 'CONCLUIDO' : 'EM_ATENDIMENTO';

        if (!numero) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Número de chamado obrigatório.' }) };
        }

        const cleanDbUrl = rawDbUrl.split('?')[0];
        client = new Client({
            connectionString: cleanDbUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // 1. Assegura tabela
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

        // 2. Busca chamado existente
        const existing = await client.query(
            `SELECT id FROM chamados_historico WHERE numero_chamado = $1 ORDER BY id DESC LIMIT 1`,
            [numero]
        );

        if (existing.rows.length > 0) {
            await client.query(`
                UPDATE chamados_historico
                SET problema_constatado = $1, solucao_efetuada = $2, validado_por = $3, status_atendimento = $4, analista_nome = $5
                WHERE id = $6;
            `, [problema, solucao, validacao, statusAtendimento, analista, existing.rows[0].id]);
        } else {
            await client.query(`
                INSERT INTO chamados_historico (numero_chamado, problema_constatado, solucao_efetuada, validado_por, status_atendimento, analista_nome)
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [numero, problema, solucao, validacao, statusAtendimento, analista]);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Chamado gravado no Neon DB!',
                ticket: { numero, problema, solucao, validacao, status: statusAtendimento }
            })
        };
    } catch (err) {
        console.error('Erro save-ticket Neon DB:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    } finally {
        if (client) {
            await client.end().catch(() => {});
        }
    }
};
