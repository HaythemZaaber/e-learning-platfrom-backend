import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested, IsEmail, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company'
}

export class AddressDto {
  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  line1: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;  // Changed from postal_code

  @ApiProperty({ description: 'Country code (e.g., US, CA)' })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  firstName: string;  // Changed from first_name

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;  // Changed from last_name

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
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
  @IsNotEmpty()
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
  @ApiProperty({ description: 'Country code (e.g., US, CA)', example: 'US' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Email address for the Stripe account', example: 'instructor@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Business type', 
    enum: BusinessType,
    example: BusinessType.INDIVIDUAL 
  })
  @IsEnum(BusinessType, {
    message: 'businessType must be one of the following values: individual, company'
  })
  businessType: BusinessType;  // Changed from business_type

  @ApiProperty({ 
    description: 'Individual information (required for individual accounts)', 
    required: false,
    type: () => IndividualDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IndividualDto)
  individual?: IndividualDto;

  @ApiProperty({ 
    description: 'Company information (required for company accounts)', 
    required: false,
    type: () => CompanyDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDto)
  company?: CompanyDto;
}