import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company'
}

export class AddressDto {
  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  line1: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postal_code: string;

  @ApiProperty({ description: 'Country code (e.g., US, CA)' })
  @IsString()
  country: string;
}

export class DateOfBirthDto {
  @ApiProperty({ description: 'Day of birth (1-31)' })
  @IsNumber()
  day: number;

  @ApiProperty({ description: 'Month of birth (1-12)' })
  @IsNumber()
  month: number;

  @ApiProperty({ description: 'Year of birth' })
  @IsNumber()
  year: number;
}

export class IndividualDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Address information', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiProperty({ description: 'Date of birth', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateOfBirthDto)
  dob?: DateOfBirthDto;
}

export class CompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Address information', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class CreateStripeConnectAccountDto {
  @ApiProperty({ description: 'Country code (e.g., US, CA)' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Email address for the Stripe account' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Business type', enum: BusinessType })
  @IsEnum(BusinessType)
  business_type: BusinessType;

  @ApiProperty({ description: 'Individual information (required for individual accounts)', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => IndividualDto)
  individual?: IndividualDto;

  @ApiProperty({ description: 'Company information (required for company accounts)', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDto)
  company?: CompanyDto;
}
