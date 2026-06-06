import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export class WalletEntryDto {
  @IsString()
  @IsIn(['evm', 'solana', 'tron'])
  chain!: string;

  @IsString()
  @MaxLength(200)
  @Matches(
    new RegExp(
      [
        EVM_ADDRESS_REGEX.source,
        SOLANA_ADDRESS_REGEX.source,
        TRON_ADDRESS_REGEX.source,
      ].join('|'),
    ),
    { message: 'Invalid wallet address for the selected chain' },
  )
  address!: string;
}

export class UpdateWalletsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletEntryDto)
  wallets!: WalletEntryDto[];
}
