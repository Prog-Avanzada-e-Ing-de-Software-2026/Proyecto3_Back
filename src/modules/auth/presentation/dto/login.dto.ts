import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Entrada del inicio de sesión.
 *
 * Valida formato y presencia, que es lo que corresponde al borde HTTP: la
 * verificación de la credencial es del dominio. El `message` de cada decorador
 * es el texto que ve el cliente en `errores`.
 */
export class LoginDto {
  @ApiProperty({ example: 'alumno@gym.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @ApiProperty({ example: '30123456', description: 'Contraseña del usuario' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;
}
