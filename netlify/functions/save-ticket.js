/**
 * Netlify Serverless Function — POST /api/save-ticket
 * Projeto: Godoy FreshOps AI — Salva ou atualiza um chamado manualmente registrado no app diretamente no Neon PostgreSQL
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
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
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido. Envie POST.' })
        };
    }

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.warn('⚠️ DATABASE_URL não encontrada nas variáveis do Netlify.');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: false,
                source: 'local_storage',
                message: 'DATABASE_URL não configurada no Netlify Site Settings.'
            })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');

        const numero = payload.numero;
        const problema = payload.problema || 'Atendimento de suporte técnico';
        const solucao = payload.solucao || 'Aguardando atendimento';
        const validacao = payload.validacao || 'Em atendimento';
        const analista = payload.analista || 'Caique Eduardo';
        const isConcluido = solucao && solucao !== 'Aguardando atendimento' && solucao !== 'Aguardando encerramento/atendimento.';
        const statusAtendimento = isConcluido ? 'CONCLUIDO' : 'EM_ATENDIMENTO';

        if (!numero) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Número de chamado é obrigatório.' })
            };
        }

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
                solucao_efetuada TEXT NOT NULL DEFAULT 'Aguardando atendimento',
                validado_por VARCHAR(255) NOT NULL DEFAULT 'Em atendimento',
                status_atendimento VARCHAR(50) NOT NULL DEFAULT 'EM_ATENDIMENTO',
                analista_nome VARCHAR(255) DEFAULT 'Caique Eduardo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Upsert no Neon DB
        const existing = await client.query(
            `SELECT id FROM chamados_historico WHERE numero_chamado = $1 AND data_chamado = CURRENT_DATE`,
            [numero]
        );

        if (existing.rows.length > 0) {
            await client.query(`
                UPDATE chamados_historico
                SET problema_constatado = $1, solucao_efetuada = $2, validado_por = $3, status_atendimento = $4, analista_nome = $5
                WHERE numero_chamado = $6 AND data_chamado = CURRENT_DATE;
            `, [problema, solucao, validacao, statusAtendimento, analista, numero]);
        } else {
            await client.query(`
                INSERT INTO chamados_historico (numero_chamado, problema_constatado, solucao_efetuada, validado_por, status_atendimento, analista_nome)
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [numero, problema, solucao, validacao, statusAtendimento, analista]);
        }

        await client.end();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Chamado salvo com sucesso no Neon PostgreSQL!',
                ticket: { numero, problema, solucao, validacao, status: statusAtendimento }
            })
        };
    } catch (err) {
        console.error('Erro ao salvar chamado no Neon DB:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Erro ao conectar com Neon DB' })
        };
    }
};
