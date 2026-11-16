import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Entrada del inicio de sesión.
 *
 * Valida formato y presencia, que es lo que corresponde al borde HTTP: la
 * verificación de la credencial es del dominio.
 */
export class LoginDto {
  @ApiProperty({ example: 'alumno@gym.com', description: 'Email del usuario' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '30123456', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
