import { IsString, IsNotEmpty } from 'class-validator';

export class StreamOutputDto {
  @IsString()
  @IsNotEmpty()
  data: string;
}
