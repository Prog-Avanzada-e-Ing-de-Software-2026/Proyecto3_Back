import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';

/**
 * Parámetros de OWASP para `argon2id`: el mínimo recomendado.
 *
 * Se declaran explícitos, aunque coincidan con los valores por defecto de la
 * biblioteca, para que subirlos sea una decisión visible. El hash almacenado es
 * autodescriptivo (`$argon2id$v=19$m=19456,t=2,p=1$...`), así que cambiarlos no
 * invalida las credenciales ya persistidas.
 */
const OPCIONES_ARGON2 = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Adaptador de hashing sobre `argon2id`. El trabajo corre fuera del event loop. */
@Injectable()
export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(claro: string): Promise<string> {
    return hash(claro, OPCIONES_ARGON2);
  }

  async verify(hashAlmacenado: string, claro: string): Promise<boolean> {
    try {
      return await verify(hashAlmacenado, claro);
    } catch {
      // Un hash corrupto o con formato desconocido no autentica a nadie: es la
      // única recuperación posible y no oculta la causa, porque el valor no se
      // registra ni se propaga.
      return false;
    }
  }
}
