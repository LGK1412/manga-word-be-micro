import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StyleDocument = Style & Document;

@Schema({ timestamps: true })
export class Style {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['normal', 'hide'], default: 'normal' })
  status: string;
}

export const StyleSchema = SchemaFactory.createForClass(Style);
