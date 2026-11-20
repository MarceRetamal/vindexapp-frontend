// Pruebas de la búsqueda del panel. Corren con el test runner de Node, sin dependencias: `npm test`.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buscar, coincide, palabrasDeBusqueda, puntaje } from '../src/lib/texto.ts';

describe('palabrasDeBusqueda', () => {
  it('ignora tildes y mayúsculas, separa por signos y descarta "c/", "s/" y palabras vacías', () => {
    assert.deepEqual(palabrasDeBusqueda('Celie c/ VERGARA Rocío s/ cuidado personal de hijos'), [
      'celie', 'vergara', 'rocio', 'cuidado', 'personal', 'hijos',
    ]);
  });

  it('conserva palabras cortas si son lo único buscado, y los números', () => {
    assert.deepEqual(palabrasDeBusqueda('de'), ['de']);
    assert.deepEqual(palabrasDeBusqueda('Juzgado Nº 7'), ['juzgado', '7']);
  });
});

describe('puntaje', () => {
  const caratula = 'PÉREZ, JUAN C/ GÓMEZ ANA S/ ALIMENTOS';

  it('0 si el título empieza con lo buscado, en orden', () => {
    assert.equal(puntaje('perez juan', caratula), 0);
    assert.equal(puntaje('Pérez c/ Gómez', caratula), 0);
  });

  it('1 si el título lo contiene en orden', () => {
    assert.equal(puntaje('gomez alimentos', caratula), 1);
  });

  it('2 si el título tiene todas las palabras en otro orden', () => {
    assert.equal(puntaje('alimentos perez', caratula), 2);
  });

  it('3 si alguna palabra está solo en el resto de los datos', () => {
    assert.equal(puntaje('perez familia', caratula, 'Juzgado de Familia Nº 7'), 3);
  });

  it('null si falta alguna palabra', () => {
    assert.equal(puntaje('perez divorcio', caratula, 'Juzgado de Familia Nº 7'), null);
  });

  it('sin búsqueda, todo coincide', () => {
    assert.equal(puntaje('  ', caratula), 0);
    assert.equal(coincide('', caratula), true);
  });
});

describe('buscar', () => {
  const expedientes = [
    { id: 'juzgado', caratula: 'ROMERO DIEGO C/ LUNA ANA S/ DAÑOS', juzgado: 'Juzgado de Paz de Luna' },
    { id: 'contiene', caratula: 'GARCIA PEDRO C/ LUNA RENÉ S/ COBRO', juzgado: 'Civil 3' },
    { id: 'ajena', caratula: 'FERNANDEZ LAURA C/ ROMERO S/ ALIMENTOS', juzgado: 'Familia 1' },
    { id: 'desordenada', caratula: 'RENE PABLO C/ LUNA SA S/ COBRO', juzgado: 'Civil 5' },
    { id: 'empieza', caratula: 'LUNA RENE C/ PROVINCIA ART S/ ACCION', juzgado: 'Laboral 2' },
  ];
  const campos = (e: (typeof expedientes)[number]) => ({ titulo: e.caratula, resto: e.juzgado });

  it('pone primero lo que más se parece al título y saca lo que no coincide', () => {
    assert.deepEqual(
      buscar(expedientes, 'Luna René', campos).map((e) => e.id),
      ['empieza', 'contiene', 'desordenada']
    );
  });

  it('una palabra que solo está en el juzgado queda después de las del título', () => {
    assert.deepEqual(
      buscar(expedientes, 'romero', campos).map((e) => e.id),
      ['juzgado', 'ajena']
    );
    assert.deepEqual(
      buscar(expedientes, 'paz', campos).map((e) => e.id),
      ['juzgado']
    );
  });

  it('respeta el orden original dentro de cada grupo y sin búsqueda devuelve la lista igual', () => {
    assert.deepEqual(
      buscar(expedientes, 'cobro', campos).map((e) => e.id),
      ['contiene', 'desordenada']
    );
    assert.equal(buscar(expedientes, '', campos), expedientes);
  });
});
