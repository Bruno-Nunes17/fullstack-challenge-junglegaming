import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class PlaceBetDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1.00)
  @Max(1000.00)
  amount: number;
}
