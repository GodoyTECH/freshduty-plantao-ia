const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRoundSections, migrateFloorValidator, normalizeGeneralRounds } = require('../js/ronda-domain');

function floor(nome, overrides = {}) {
    return {
        id: Number.parseInt(nome, 10), nome, existe: true,
        hasMaquina: true, maquinaStatus: 'OK', maquinaSetor: '', maquinaAla: '', maquinaObs: '',
        hasPosto: true, postoStatus: 'OK', postoSetor: '', postoAla: '', postoObs: '',
        hasPainel: false, painelStatus: 'OK', painelSetor: '', painelAla: '', painelObs: '',
        validado: 'Fernanda Lima', ...overrides
    };
}

const critical = [{ nome: 'ATRIUM', status: 'OK', obs: '', validado: 'Equipe Atrium' }];

test('inclui Painéis e Totens do 2º e 3º andar, mas omite o item desmarcado no 4º', () => {
    const report = buildRoundSections(critical, [
        floor('2º Andar', { hasPainel: true }),
        floor('3º Andar', { hasPainel: true }),
        floor('4º Andar')
    ]);
    assert.equal((report.match(/Painéis e Totens/g) || []).length, 2);
    assert.match(report, /2º Andar[\s\S]*Painéis e Totens: OK/);
    assert.doesNotMatch(report.slice(report.indexOf('*4º Andar*')), /Painéis e Totens/);
});

test('exibe exatamente um validador por andar e reflete o nome atualizado', () => {
    const current = floor('2º Andar', { hasPainel: true, validado: 'Nome Atualizado' });
    const report = buildRoundSections([], [current]);
    assert.equal((report.match(/Validado com:/g) || []).length, 1);
    assert.match(report, /Validado com: Nome Atualizado/);
});

test('pendência contém Setor, Ala e descrição; mudar para OK remove detalhes', () => {
    const pending = floor('3º Andar', {
        maquinaStatus: 'PENDENTE', maquinaSetor: 'UTI', maquinaAla: 'Sul', maquinaObs: 'Sem rede'
    });
    const first = buildRoundSections([], [pending]);
    assert.match(first, /Sem rede \(Setor: UTI \| Ala: Sul\)/);

    pending.maquinaStatus = 'OK';
    const second = buildRoundSections([], [pending]);
    assert.match(second, /Máquina de Contingência: OK/);
    assert.doesNotMatch(second, /Sem rede|Setor: UTI|Ala: Sul/);
});

test('aplicabilidade controla a inclusão sem depender de visibilidade no DOM', () => {
    const hidden = floor('4º Andar', { existe: false, collapsed: false });
    const collapsed = floor('5º Andar', { existe: true, collapsed: true });
    const report = buildRoundSections([], [hidden, collapsed]);
    assert.doesNotMatch(report, /4º Andar/);
    assert.match(report, /5º Andar/);
});

test('migra validador legado igual e preserva divergências sem escolha arbitrária', () => {
    const same = migrateFloorValidator({ maquinaValidado: 'Joana', postoValidado: 'Joana', painelValidado: '' });
    assert.equal(same.validado, 'Joana');
    assert.equal(same.validatorMigrationConflict, false);

    const conflict = migrateFloorValidator({ maquinaValidado: 'Joana', postoValidado: 'Carlos' });
    assert.equal(conflict.validado, '');
    assert.equal(conflict.validatorMigrationConflict, true);
    assert.deepEqual(conflict.legacyValidators, { maquina: 'Joana', posto: 'Carlos' });
});

test('normalização após salvar e recarregar mantém validador único e estados', () => {
    const saved = JSON.parse(JSON.stringify([floor('2º Andar', { hasPainel: true, painelStatus: 'PENDENTE' })]));
    const restored = normalizeGeneralRounds([floor('2º Andar', { validado: '' })], saved);
    assert.equal(restored[0].validado, 'Fernanda Lima');
    assert.equal(restored[0].hasPainel, true);
    assert.equal(restored[0].painelStatus, 'PENDENTE');
});
