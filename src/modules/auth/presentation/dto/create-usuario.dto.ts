import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Entrada del alta de un usuario con su rol.
 *
 * La credencial mínima y la unicidad del email son reglas del dominio y no se
 * duplican acá: el DTO valida formato y presencia.
 */
export class CreateUsuarioDto {
  @ApiProperty({ example: 'profesor@gym.com', description: 'Email del usuario' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @ApiProperty({ example: '30123456', description: 'Contraseña inicial del usuario' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;

  @ApiProperty({ example: 'Profesor', description: 'Nombre del rol a asignar' })
  @IsString({ message: 'El rol debe ser un texto.' })
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  rolNombre!: string;
}
