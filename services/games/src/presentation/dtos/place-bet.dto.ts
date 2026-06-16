import { IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class PlaceBetDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1.00)
  @Max(1000.00)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1.10)
  @Max(100.00)
  autoCashoutMultiplier?: number;
}
