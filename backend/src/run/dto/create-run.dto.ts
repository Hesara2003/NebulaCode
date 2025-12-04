import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRunDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsNotEmpty()
  fileId!: string;

  @IsString()
  @IsOptional()
  language?: string;
}
