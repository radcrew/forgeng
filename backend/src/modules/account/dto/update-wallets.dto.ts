import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import {
  IsWalletAddressForChain,
  SUPPORTED_CHAINS,
} from '../../../common/utils/wallet';

export class WalletEntryDto {
  @IsString()
  @IsIn(SUPPORTED_CHAINS)
  chain!: string;

  // Checked against the chosen chain, so an address from another chain is
  // refused even when it looks valid.
  @IsString()
  @MaxLength(200)
  @IsWalletAddressForChain()
  address!: string;
}

export class UpdateWalletsDto {
  // A student has at most one withdrawal address.
  @IsArray()
  @ArrayMaxSize(1, { message: 'Only one withdrawal address is allowed' })
  @ValidateNested({ each: true })
  @Type(() => WalletEntryDto)
  wallets!: WalletEntryDto[];
}
