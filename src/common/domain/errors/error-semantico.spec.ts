import { describe, expect, it } from 'vitest';
import { CATEGORIAS_ERROR, ErrorSemantico } from './error-semantico.js';

describe('ErrorSemantico', () => {
  it.each(CATEGORIAS_ERROR)(
    '[error-semantico] conserva la categoria %s, el codigo y el mensaje seguro',
    (categoria) => {
      const error = new ErrorSemantico(categoria, 'CODIGO_ESTABLE', 'mensaje seguro');

      expect(error).toBeInstanceOf(Error);
      expect(error.categoria).toBe(categoria);
      expect(error.codigo).toBe('CODIGO_ESTABLE');
      expect(error.message).toBe('mensaje seguro');
      expect(error.stack).toBeDefined();
    },
  );
});
