import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from "class-validator"
import { Transform } from "class-transformer"

export class UpdateImageChapterDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  price?: number

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  order?: number

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  is_published?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  is_completed?: boolean

  @IsOptional()
  @IsString()
  content?: string

  // --- XỬ LÝ EXISTING IMAGES ---
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return []
    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return value
  })
  existing_images?: Array<{ url: string; order: number }>

  // --- THÊM PHẦN NÀY: XỬ LÝ NEW IMAGES META ---
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return []
    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return value
  })
  new_images_meta?: Array<{ originalname: string; order: number }>
}