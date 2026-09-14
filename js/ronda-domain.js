(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.RondaDomain = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const EQUIPMENTS = [
        { prefix: 'maquina', enabled: 'hasMaquina', label: 'Máquina de Contingência' },
        { prefix: 'posto', enabled: 'hasPosto', label: 'Posto de Enfermagem' },
        { prefix: 'painel', enabled: 'hasPainel', label: 'Painéis e Totens' }
    ];

    function migrateFloorValidator(floor) {
        if (Object.prototype.hasOwnProperty.call(floor, 'validado')) return { ...floor };

        const legacyValidators = EQUIPMENTS.reduce((values, equipment) => {
            const value = String(floor[`${equipment.prefix}Validado`] || '').trim();
            if (value) values[equipment.prefix] = value;
            return values;
        }, {});
        const uniqueNames = [...new Set(Object.values(legacyValidators))];

        return {
            ...floor,
            validado: uniqueNames.length === 1 ? uniqueNames[0] : '',
            validatorMigrationConflict: uniqueNames.length > 1,
            // Os campos legados permanecem no objeto para preservar o histórico.
            legacyValidators
        };
    }

    function normalizeGeneralRounds(defaults, saved = []) {
        return defaults.map((item) => {
            const previous = saved.find(value => value.nome === item.nome) || {};
            return { ...item, ...migrateFloorValidator(previous) };
        });
    }

    function floorLines(floor) {
        if (!floor.existe) return [];
        const lines = [`*${floor.nome}*`];
        EQUIPMENTS.forEach(({ prefix, enabled, label }) => {
            if (!floor[enabled]) return;
            if (floor[`${prefix}Status`] === 'PENDENTE') {
                const location = [
                    floor[`${prefix}Setor`] ? `Setor: ${floor[`${prefix}Setor`]}` : '',
                    floor[`${prefix}Ala`] ? `Ala: ${floor[`${prefix}Ala`]}` : ''
                ].filter(Boolean).join(' | ');
                lines.push(`   • 🟡 ${label}: ${floor[`${prefix}Obs`] || 'Pendente'}${location ? ` (${location})` : ''}`);
            } else {
                lines.push(`   • 🟢 ${label}: OK`);
            }
        });
        if (floor.validado) lines.push(`   • Validado com: ${floor.validado}`);
        else if (floor.validatorMigrationConflict) lines.push('   • ⚠️ Validador do andar: definição necessária (dados históricos divergentes)');
        return lines;
    }

    function buildRoundSections(criticalRounds, generalRounds) {
        const lines = ['🔥 *SETORES CRÍTICOS*'];
        criticalRounds.forEach((round) => {
            lines.push(`${round.status === 'OK' ? '🟢' : '🟡'} *${round.nome}*`);
            lines.push(`   • Status: ${round.status === 'OK' ? '100% OK' : 'Com Pendência'}`);
            if (round.status === 'PENDENTE') lines.push(`   • Pendência: ${round.obs || 'Em atendimento'}`);
            if (round.validado) lines.push(`   • Validado com: ${round.validado}`);
            lines.push('');
        });
        lines.push('🏢 *SETORES GERAIS*');
        generalRounds.forEach((floor) => {
            const current = floorLines(floor);
            if (current.length) lines.push(...current, '');
        });
        return lines.join('\n').trimEnd();
    }

    return { EQUIPMENTS, migrateFloorValidator, normalizeGeneralRounds, floorLines, buildRoundSections };
}));
